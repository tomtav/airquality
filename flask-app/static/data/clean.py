import json
import numpy as np
import pandas as pd

with open('uhf42.geojson') as f:
    uhf_geo = pd.json_normalize(json.load(f)['features'])

with open('uhf_crosswalk.json') as f:
    uhf_codes = pd.json_normalize(json.load(f))

uhf_codes = uhf_codes.rename(columns={
    'Fips': 'properties.uhfcode',
    'Borough': 'properties.borough',
    'NTA_Name': 'properties.uhf_neigh',
    'Zipcode': 'properties.postalCode'
})


df = uhf_geo.merge(uhf_codes[['properties.uhfcode', 'properties.postalCode']],
                   how='inner', on='properties.uhfcode', left_index=False, right_index=False)


# Load and Merge Household income data
incomes = pd.read_csv('incomes.csv', skiprows=5, encoding='utf8')
incomes = incomes.rename(columns={
    'Location': 'properties.uhf_neigh',
    'Income Level': 'properties.income_level',
    'TimeFrame': 'properties.year',
    'DataFormat': 'properties.data_format',
    'Data': 'properties.income_count',
    'Fips': 'properties.uhfcode'
})
incomes = incomes[(incomes['properties.year'] == 2015)
                  &
                  (incomes['properties.data_format'] == 'Number')
                  &
                  (incomes['properties.uhfcode'] < 1000)
                  ][['properties.uhfcode', 'properties.year', 'properties.income_level', 'properties.data_format', 'properties.income_count']]

df = df.merge(incomes, how='inner', on='properties.uhfcode',
              left_index=False, right_index=False)

# Load and Merge children ER visits
ervisits = pd.read_csv('ervisits.csv', skiprows=5, encoding='utf8')
ervisits = ervisits.rename(columns={
    'Location': 'properties.uhf_neigh',
    'Age Group': 'properties.age',
    'TimeFrame': 'properties.year',
    'DataFormat': 'properties.data_format',
    'Data': 'properties.ervisits_count',
    'Fips': 'properties.uhfcode'
})
ervisits['properties.uhfcode'] = ervisits['properties.uhfcode'].str.lstrip(
    'uhf').astype(int)

ervisits = ervisits[
    (ervisits['properties.age'] == '0 to 17 Years')
    &
    (ervisits['properties.year'] == 2015)
    &
    (ervisits['properties.data_format'] == 'Number')
    &
    (ervisits['properties.uhfcode'] < 1000)
][['properties.uhfcode', 'properties.year', 'properties.age', 'properties.data_format', 'properties.ervisits_count']]


df = df.merge(ervisits, how='inner', on=[
              'properties.uhfcode', 'properties.year', 'properties.data_format'], left_index=False, right_index=False)


# Load and merge trees census data with uhf areas using zipcodes
trees = pd.read_csv('trees.csv', encoding='utf8')
print(trees.columns)
trees['year'] = pd.DatetimeIndex(trees['created_at']).year
trees = trees[trees['year'] == 2015]
trees = trees[['postcode', 'year', 'borough', 'tree_id', 'tree_dbh', 'health', 'spc_common', 'spc_latin', 'latitude', 'longitude']].rename(columns={
    'postcode': 'properties.postalCode',
    'year': 'properties.year',
    'borough': 'properties.borough',
    'tree_id': 'properties.tree_id',
    'tree_dbh': 'properties.tree_dbh',
    'health': 'properties.tree_health',
    'spc_common': 'properties.tree_common',
    'spc_latin': 'properties.tree_latin',
    'latitude': 'properties.tree_lat',
    'longitude': 'properties.tree_lon'
})


#trees.loc[trees['properties.postalCode'].isin(uhf_codes['properties.postalCode'].values),'properties.uhfcode'] = uhf_codes['properties.uhfcode']

uhf_zips = pd.concat([pd.Series(row['properties.uhfcode'], row['properties.postalCode'].split(
    ',')) for _, row in uhf_codes.iterrows()]).reset_index().rename(columns={'index': 'properties.postalCode', 0: 'properties.uhfcode'})
uhf_zips['properties.postalCode'] = uhf_zips['properties.postalCode'].astype(
    int)
trees = pd.merge(trees, uhf_zips, on=['properties.postalCode'], how='inner')
trees = trees.assign(dbh_bin=np.select([trees['properties.tree_dbh'] <= 12, (trees['properties.tree_dbh'] > 12) & (
    trees['properties.tree_dbh'] <= 20), trees['properties.tree_dbh'] > 20], ['small', 'medium', 'large'])).rename(columns={'dbh_bin': 'properties.tree_dbh_bin'})

zip_counts = (trees.groupby('properties.postalCode')[['properties.postalCode']].count(
)).rename(columns={'properties.postalCode': 'properties.tree_cnt_zip'}).reset_index()
uhf_counts = (trees.groupby('properties.uhfcode')[['properties.uhfcode']].count(
)).rename(columns={'properties.uhfcode': 'properties.tree_cnt_uhf'}).reset_index()
boro_counts = (trees.groupby('properties.borough')[['properties.borough']].count(
)).rename(columns={'properties.borough': 'properties.tree_cnt_boro'}).reset_index()

trees = trees.merge(zip_counts, on=['properties.postalCode'], how='inner')
trees = trees.merge(uhf_counts, on=['properties.uhfcode'], how='inner')
trees = trees.merge(boro_counts, on=['properties.borough'], how='inner')

tree_health = (trees.groupby([
    'properties.year',
    'properties.postalCode',
    'properties.tree_health'
])[['properties.tree_health']].count()
).rename(columns={'properties.tree_health': 'health_count'
                  }).reset_index().pivot_table('health_count', ['properties.year', 'properties.postalCode'], 'properties.tree_health')


df = df.merge(uhf_counts, on=['properties.uhfcode'],
              how='inner',
              left_index=False,
              right_index=False)
print(df.shape)
df = df.merge(boro_counts, on=['properties.borough'],
              how='inner',
              left_index=False,
              right_index=False)
print(df.shape)


geojson = {'type': 'FeatureCollection', 'features': []}
props = [key for key in list(set([col.split('.')[0]
                                  for col in df.columns if '.' in col]))]
for index, row in df.iterrows():
    feature = {'type': 'Feature'}
    for key in props:
        feature[key] = {}
        for col in row.keys():
            if(key in col):
                feature[key][col.split('.')[1]] = row[col]
    geojson['features'].append(feature)

# with open('uhf_final.geojson', 'w') as outfile:
#     json.dump(geojson, outfile, indent=4)

""" 
## For use with supercluster leaflet plugin
 
with open('Trees.json') as f:
    trees_json = json.load(f)
    
geopoints = { type: 'FeatureCollection', 'features': [] }

for tree in trees_json:
    point = { 'type': 'Feature', 'geometry': { 'type': 'Point', 'coordinates': [] }, 'properties': {}}
    point['geometry']['coordinates'] = [tree['latitude'],tree['longitude']]
    point['properties'] = tree
    geopoints['features'].append(point)

with open('tree_points.geojson', 'w') as outfile:
    json.dump(geojson,outfile,indent=4)
"""

# Split Trees Data into multiple files
# in order to upload on GitHub
trees_json = json.loads(trees.rename(columns={
    'properties.postalCode': 'postcode',
    'properties.year': 'year',
    'properties.borough': 'borough',
    'properties.tree_id': 'tree_id',
    'properties.tree_dbh': 'tree_dbh',
    'properties.tree_health': 'health',
    'properties.tree_common': 'spc_common',
    'properties.tree_latin': 'spc_latin',
    'properties.tree_lat': 'latitude',
    'properties.tree_lon': 'longitude',
    'properties.uhfcode': 'uhfcode',
    'properties.tree_dbh_bin': 'dbh_bin',
    'properties.tree_cnt_zip': 'tree_cnt_zip',
    'properties.tree_cnt_uhf': 'tree_cnt_uhf',
    'properties.tree_cnt_boro': 'tree_cnt_boro'
}).to_json(orient='records'))

arrays = {}
counter = 0
for i, tree in enumerate(trees_json):
    if(i % 200000 == 0):
        counter += 1
        arrays[f'trees_{counter}'] = []
        print(f'processing group trees_{counter}')
        arrays[f'trees_{counter}'].append(tree)
    else:
        arrays[f'trees_{counter}'].append(tree)
"""       
for key in arrays.keys():
    with open(f'{key}.geojson', 'w') as outfile:
        json.dump(arrays[key], outfile, indent=4)
"""
