var mapboxAccessToken = API_KEY;

var map = L.map('map').setView([40.6892, -74.0445], 10);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
  id: 'mapbox/light-v10',
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  tileSize: 512,
  zoomOffset: -1
}).addTo(map);


/*
// Grab the tree data with d3
Trees.json
{
    "OBJECTID":"592373",
    "tree_dbh":6,
    "spc_latin":"PYRUS CALLERYANA",
    "spc_common":"PEAR, CALLERY",
    "latitude":40.632653,
    "longitude":-74.000245,
    "status":Good,
    "nta_name":"Borough Park"
}
*/


// Create a new marker cluster group
var markers = L.markerClusterGroup();

var treeData = "static/data/Trees.json";
d3.json(treeData).then(trees => {
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

    // Add our marker cluster layer to the map
    map.addLayer(markers)
  })
}).catch(error => console.log(error))

