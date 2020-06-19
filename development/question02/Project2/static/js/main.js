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

  var mapboxAccessToken = API_KEY;
  var map = L.map('map').setView([40.8075, -73.9626], 14);
  
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map);
  
  function onEachFeature(feature, layer) {
    let tooltip = "<h5>" + feature.properties.borough + " (" + feature.properties.uhf_neigh + ")" +
      "</h5><hr><p>" + "Er Visits : " + feature.properties.ervisits + "</p>" +
      "</h5><hr><p>" + "Age : " + feature.properties.age + "</p>" +
      "</h5><hr><p>" + "Year : " + feature.properties.year + "</p>";
    if (feature.properties.ervisits.length) {
      feature.properties.ervisits.forEach(income => {
        tooltip += "<p>" + income.level + " - " + income.amount + "</p>"
      })
    }
    layer.bindPopup(tooltip);

    
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
    return boros[d]
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
  
  //income_levels = households.map(d => d['Income Level']).filter((v, i, a) => a.indexOf(v) === i);
  //10464, 10004
  var dropDown = d3.select('select').attr('id', 'chooser')
    .on('change', onChange)
  
    // Load in geojson data
var geoData = "static/data/uhf_final.geojson";
  d3.json(geoData)
  .then(function(data){
  var geojson = L.choropleth(data, {
        onEachFeature: onEachFeature,
        // Define what  property in the features to use
    valueProperty: "ervisits",

    // Set color scale (in hex values)
    scale: [
        "#ffffcc",
        "#c2e699",
        "#78c679",
        "#31a354",
        "#006837",
    ].reverse(),

    // Number of breaks in step range
    steps: 5,

    // q for quantile, e for equidistant, k for k-means
    mode: "q",
    style: {
      // Border color
      color: "#006d2c",
      weight: 1,
      fillOpacity: 0.8
    }
    })
    .addTo(map);
    // Set up the legend
    var legend = L.control({ position: "bottomleft" });

  // onAdd: "the map calls the onAdd() method of the layer, then the layer
  //        creates its HTML element(s) (commonly named ‘container’ element)
  //        and adds them to the map pane."
  // Ref: https://leafletjs.com/examples/extending/extending-2-layers.html
    legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend");
    var limits = geojson.options.limits;
    var colors = geojson.options.colors;
    var labels = [];

    // Add min & max
    var legendInfo = "<h6>Number of Ervisits</h6>" +
      "<div class=\"labels\">" +
        "<div class=\"min\">" + limits[0] + "</div>" +
        "<div class=\"max\">" + limits[limits.length - 1] + "</div>" +
      "</div>";

    div.innerHTML = legendInfo;

    limits.forEach(function(limit, index) {
      labels.push("<li style=\"background-color: " + colors[index] + "\"></li>");
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };

  // Adding legend to the map
  legend.addTo(map);

    
    
  })
  
    var options = dropDown.selectAll(null)
    .data(ervisits_zip.map(d => d.Location).filter((v,i,a) => a.indexOf(v) === i).sort())
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
  
  
  var processed = []
  
  var locations = {
    'type': 'FeatureCollection',
    'features': []
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
        incomes = ervisits_zip.filter(d => d.TimeFrame === 2015 && d.DataFormat === 'Number' && d.Fips === uhf_info.Fips).map(d => (
          { level: d['Income Level'], year: d.TimeFrame, amount: d.Data }
        ))
        feature.properties['INCOME'] = incomes.length ? incomes : []
        locations.features.push(feature)
      })
    }
  })
  
  
 
  
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
  
 /* L.geoJson(locations, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map)
  */
  this.map.invalidateSize(true);
  
  

// Grab data with d3
d3.json(geoData, function(data) {

  // Create a new choropleth layer
  var geojson = L.choropleth(data, {

    // Define what  property in the features to use
    valueProperty: "ervisits",

    // Set color scale (in hex values)
    scale: ["#efedf5", "#bcbddc", "#756bb1"],

    // Number of breaks in step range
    steps: 10,

    // q for quantile, e for equidistant, k for k-means
    mode: "q",
    style: {
      // Border color
      color: "#fff",
      weight: 1,
      fillOpacity: 0.8
    }
})
// Add the choropleth layer to the map
geojson.addTo(map);


});

  