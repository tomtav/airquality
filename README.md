# 2105 NYC Air Quality Analysis Dashboard
Flask web application that shows if air quality differs significantly among neighborhoods.

### Web Scraping
- NYC Neighborhood Zipcodes
- BeautifulSoup script collects the zipcodes for every neighborhood in New York City as determined by the United Hospital Fund

### Languages/Libraries
- D3 Library for data collection and web layout
- Javascript/HTML/CSS to build webpage
- Leaflet.js to provide responsive maps
- Materialize to create the dashboard
- Python/Pandas/BeautifulSoup modules for data extraction and cleaning

### Flask Application
The Flask application is hosted on Github Pages. A user can click the link in the repository to view the dashboard.

Alternatively, it can run locally. First, clone or download the entire directory. It requires a config.js file with the user’s Mapbox API key. Then, navigate to the folder with the index.html file and open a local server through the command line.

### Requirements
- pandas==0.23.3
-  Flask==1.0.2
- requests==2.18.4
- beautifulsoup4==4.6.3
- Flask-PyMongo==2.1.0
- NumPy
- OS
- D3
- Python
