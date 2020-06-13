import json
import requests
import pandas as pd
from bs4 import BeautifulSoup

url = 'https://www.health.ny.gov/statistics/cancer/registry/appendix/neighborhoods.htm'
html = requests.get(url).text

soup = BeautifulSoup(html, 'lxml')
zips = pd.DataFrame()

for item in soup.find_all('table')[0].find_all('td'):
    if (item.attrs['headers'][0] == 'header1'):
        boro = item.text.strip()
    if (item.attrs['headers'][0] == 'header2'):
        nta = item.text.strip()
    if (item.attrs['headers'][0] == 'header3'):
        zipcodes = item.text.split(',')
        for zipcode in zipcodes:
            code = zipcode.strip()
            zips = zips.append(
                {'Borough': boro, 'NTA_Name': nta, 'Zipcode': code}, ignore_index=True)

#zips.to_csv('nta_zipcodes.csv', encoding='utf8', index=False)

# geo = pd.read_csv('Modified_Zip_Code_Tabulation_Areas__MODZCTA_.csv',
#                  encoding='utf8').rename(columns={'MODZCTA': 'Zipcode'}, inplace=True)

# read NYC zipcode GEOJSON file
f = open('nta_zipcodes.geojson', 'r')
data = json.loads(f.read())
f.close()

geo_df = pd.DataFrame()

for i in data['features']:
    prop = i['properties']
    geo = i['geometry']
    row = {'Borough': prop['borough'].strip(), 'NTA_Name': prop['PO_NAME'].strip(),
           'Zipcode': prop['postalCode'].strip(), 'geometry': geo, 'features': i}
    geo_df = geo_df.append(row, ignore_index=True)


# merge all data on Zipcode
shapes = pd.merge(left=zips, right=geo_df, on='Zipcode', how='left')

#shapes.to_csv('nta_zipcodes_shapes.csv', encoding='utf8', index=False)

df = pd.read_csv(
    './CCC Data Download_20200610_022108689/Census_Demographics_at_the_Neighborhood_Tabulation_Area__NTA__level.csv',
    encoding='utf8'
)

columns = {
    'Geographic Area - Borough': 'Borough',
    'Geographic Area - 2010 Census FIPS County Code': 'FIPS',
    'Geographic Area - Neighborhood Tabulation Area (NTA)* Code': 'NTA_Code',
    'Geographic Area - Neighborhood Tabulation Area (NTA)* Name': 'NTA_Name',
    'Total Population 2000 Number': '2000 Population',
    'Total Population 2010 Number': '2010 Population',
    'Total Population Change 2000-2010 Number': 'Population Change Number',
    'Total Population Change 2000-2010 Percent': 'Population Change Percent'
}

# drop the last two rows
df.drop(df.tail(2).index, inplace=True)
