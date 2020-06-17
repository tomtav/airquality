document.addEventListener('DOMContentLoaded', function () {
  var elems = document.querySelectorAll('select')
  var instances = M.FormSelect.init(elems)
  //setTimeout(() => map.invalidateSize(), 100)
})
function onMapReady() {
  setTimeout(() => {
    map.invalidateSize();
  });
}

var colors = [
  '#d53e4f',
  '#fc8d59',
  '#fee08b',
  '#ffffbf',
  '#e6f598',
  '#99d594',
  '#3288bd'
]

var boros = {
  'Bronx': '#ffffcc',
  'Queens': '#a1dab4',
  'Brooklyn': '#41b6c4',
  'Manhattan': '#2c7fb8',
  'Staten Island': '#253494'
}

var greens = [
  '#ffffcc',
  '#f7fcb9',
  '#d9f0a3',
  '#addd8e',
  '#78c679',
  '#41ab5d',
  '#238443',
  '#005a32'
]

var income_levels = [
  '$200,000 or more',
  '$100,000 to $199,999',
  '$75,000 to $99,999',
  '$50,000 to $74,999',
  '$35,000 to $49,999',
  '$25,000 to $34,999',
  '$15,000 to $24,999',
  'under $15,000'
]

function getBoroColor(d) {
  return boros[d] ? boros[d] : '#999'
}


function getIncomeColor(d) {
  return d === '$200,000 or more' ? '#005a32' :
    d === '$100,000 to $199,999' ? '#238443' :
      d === '$75,000 to $99,999' ? '#41ab5d' :
        d === '$50,000 to $74,999' ? '#78c679' :
          d === '$35,000 to $49,999' ? '#addd8e' :
            d === '$25,000 to $34,999' ? '#d9f0a3' :
              d === '$15,000 to $24,999' ? '#f7fcb9' :
                '#ffffcc';
}
var demo, years, boroughs, levels

var processed = []

var locations = {
  'type': 'FeatureCollection',
  'features': []
}


//d3.json('flask-app/static/data/incomes.json').then(d => {
//  households = d.households

demo = households.map(d => {
  uhf = uhf_codes.filter(c => c.Fips === d.Fips)
  d.Borough = uhf.length ? uhf[0].Borough : ''
  return d
}).filter(d => d.Fips <= 1000 && d.Borough.length && d.DataFormat === 'Number' && d.TimeFrame >= 2015)

years = demo.map(d => d.TimeFrame).filter((v, i, a) => a.indexOf(v) === i).sort()

boroughs = demo.map(d => d.Borough).filter((v, i, a) => a.indexOf(v) === i).sort()

levels = demo.map(d => d['Income Level']).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseFloat(b.split(' ')[0].split('$')[1]) - parseFloat(a.split(' ')[0].split('$')[1]))

var dropDown = d3.select('select').attr('id', 'chooser')
  .on('change', onChange)

dropDown.selectAll(null)
  .data(levels.reverse())
  .enter()
  .append('option')
  .text(function (d) {
    return d
  }).attr('value', function (d) {
    return d
  })

function onChange() {
  let id = this.value;

  if (id === 'None') {
    console.error('Nothing selected')
  } else {
    console.log('filter selected : ', id)
  }
}

ntas.features.forEach(feature => {
  let id = feature.properties.OBJECTID
  let postalCode = feature.properties.postalCode

  found = uhf_codes.filter(code => code.Zipcode.split(',').includes(postalCode))
  if (found.length && !processed.includes(id)) {
    processed.push(id)
    found.forEach(uhf_info => {
      feature.properties['UHF_FIPS'] = uhf_info.Fips
      feature.properties['UHF_NAME'] = uhf_info.NTA_Name
      incomes = households.filter(d => d.TimeFrame >= 2015 && d.DataFormat === 'Number' && d.Fips === uhf_info.Fips).map(d => (
        { level: d['Income Level'], year: d.TimeFrame, amount: d.Data }
      ))
      feature.properties['INCOME'] = incomes.length ? incomes : []
      locations.features.push(feature)
    })
  }
})
var mapboxAccessToken = API_KEY;
// [40.8075, -73.9626] // CU
var map = L.map('map').setView([40.6892, -74.0445], 10);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
  id: 'mapbox/light-v10',
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  tileSize: 512,
  zoomOffset: -1
}).addTo(map);

function onEachFeature(feature, layer) {
  let tooltip = "<h5>" + feature.properties.PO_NAME + " (" + feature.properties.postalCode + ")" +
    "</h5><hr><p>" + feature.properties.UHF_FIPS + " - " + feature.properties.UHF_NAME + "</p>";
  if (feature.properties.INCOME.length) {
    feature.properties.INCOME.forEach(income => {
      tooltip += "<p>" + income.level + " - " + income.amount + "</p>"
    })
  }
  layer.bindPopup(tooltip)
  //layer.bindPopup(JSON.stringify(feature.properties))
}


function style(feature) {
  return {
    fillColor: getBoroColor(feature.properties.borough),
    weight: 2,
    opacity: 1,
    color: 'gray',
    dashArray: '3',
    fillOpacity: 0.9
  }
}

L.geoJson(locations, {
  style: style,
  onEachFeature: onEachFeature
}).addTo(map)

//})
//this.map.invalidateSize(true);
