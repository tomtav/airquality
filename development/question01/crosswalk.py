# -*- coding: utf-8 -*-
"""
Spyder Editor

This is a temporary script file.
"""

import pandas as pd
import json

df = pd.read_csv('uhf_zipcode_crosswalk.csv')

f = open('nta_zipcodes.geojson','r')
data = json.loads(f.read())
f.close()

found_df = pd.DataFrame()

processed = []

found_geo = { 
    'type': 'FeatureCollection',
    'features': []
    }

for idx, nta in enumerate(data['features']):
    postalCode = nta['properties']['postalCode']
    print(postalCode)
    found = df[df['Zipcode'].str.contains(postalCode)]
    if (len(found) and not (postalCode in processed)):
        nta['properties']['UHF_FIPS'] = found['Fips'].array[0]
        nta['properties']['UHF_NAME'] = found['NTA_Name'].array[0]
        processed.append(postalCode)
        found_geo['features'].append(nta)

#output = json.dumps(found_geo, indent=4)
with open('uhf_zipcodes.geojson', 'w') as outfile:
    json.dump(found_geo, outfile)
    