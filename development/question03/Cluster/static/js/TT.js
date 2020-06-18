d3.json('flask-app/static/data/uhf_final.geojson').then(data => {
  locations = data
  console.log(locations)
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
    //onEachFeature: onEachFeature
  }).addTo(map)

  d3.json('flask-app/static/data/Trees.json').then(trees => {
    var markers = L.markerClusterGroup();
    trees.forEach(tree => {
      if (tree.latitude && tree.longitude) {
        var marker = L.marker([tree.latitude, tree.longitude]);
        marker.bindPopup(`<h3>${tree.spc_common}</h3>
    <hr>
    <p>DBH: ${tree.tree_dbh}</p>
    <p>Status: ${tree.status}</p>
    `);
        markers.addLayer(marker);
      }
      map.addLayer(markers)
    })
  }).catch(error => console.log(error))
}).addTo(map);