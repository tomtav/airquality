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
                {'Boro': boro, 'NTA': nta, 'Zipcode': code}, ignore_index=True)

#zips.to_csv('nta_zipcodes.csv', encoding='utf8', index=False)
