import json
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


## Load and Merge Household income data
incomes = pd.read_csv('incomes.csv', skiprows=5, encoding='utf8')
incomes = incomes.rename(columns={
    'Location': 'properties.uhf_neigh',
    'Income Level': 'properties.income_level',
    'TimeFrame': 'properties.year',
    'Data': 'properties.households',
    'Fips': 'properties.uhfcode'
    })
incomes = incomes[(incomes['DataFormat']=='Percent')
                  &
                  (incomes['properties.year'] >= 2015)
                  &
                  (incomes['properties.uhfcode'] < 1000)
                  ][['properties.uhfcode','properties.year','properties.income_level','properties.households']]

df = df.merge(incomes, how='inner', on='properties.uhfcode', left_index=False, right_index=False)

## Load and Merge children ER visits
ervisits = pd.read_csv('ervisits.csv', skiprows=5, encoding='utf8')
ervisits = ervisits.rename(columns={
    'Location': 'properties.uhf_neigh',
    'Age Group': 'properties.age',
    'TimeFrame': 'properties.year',
    'Data': 'properties.ervisits',
    'Fips': 'properties.uhfcode'
    })
ervisits['properties.uhfcode'] = ervisits['properties.uhfcode'].str.lstrip('uhf').astype(int)

ervisits = ervisits[
                    (ervisits['properties.age'] == '0 to 17 Years')
                    &
                    (ervisits['DataFormat']=='Number')
                    &
                    (ervisits['properties.year'] >= 2015)
                    &
                    (ervisits['properties.uhfcode'] < 1000)
                    ][['properties.uhfcode','properties.year','properties.age','properties.ervisits']]


df = df.merge(ervisits, how='inner', on=['properties.uhfcode','properties.year'], left_index=False, right_index=False)


## Load and merge trees census data with uhf areas
trees = pd.read_csv('trees.csv', encoding='utf8')
trees['year'] = pd.DatetimeIndex(trees['created_at']).year
trees = trees[['postcode','year','health','spc_common','spc_latin','latitude','longitude']].rename(columns={
    'postcode': 'properties.postalCode',
    'year': 'properties.year',
    'health': 'properties.tree_health',
    'spc_common': 'properties.tree_common',
    'spc_latin': 'properties.tree_latin',
    'latitude': 'properties.tree_lat',
    'longitude': 'properties.tree_lon'
    })



geojson = { 'type': 'FeatureCollection', 'features': [] }
props = [ key for key in list(set([col.split('.')[0] for col in df.columns if '.' in col ]))]
for index, row in df.iterrows():
    feature = { 'type': 'Feature' }
    for key in props:
        feature[key] = {}
        for col in row.keys():
            if(key in col):
                feature[key][col.split('.')[1]]= row[col]
    geojson['features'].append(feature)
    
#with open('uhf_final.geojson', 'w') as outfile:
#    json.dump(geojson, outfile, indent=4)
