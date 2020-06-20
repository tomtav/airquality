var cluster;
var ready = false;
var map;
const mapDefaultZoom = {
  center: [40.6892, -74.0445],
  zoom: 10
}
function createTreeMap(data) {

  let boroughs = data.features.map(d => d.properties.borough).filter((v, i, a) => a.indexOf(v) === i).sort()

  let locations = data
  const format = d3.format(',d')

  map = L.map('map', { scrollWheelZoom: false }).setView(mapDefaultZoom.center, mapDefaultZoom.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  /* 
    const mapboxAccessToken = API_KEY;
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map); 
  */

  let info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = '<h6>NYC Trees Distribution</h6>' + (props ?
      `<b>${props.uhf_neigh} (${props.borough})</b>
      <br/>
       <table class="no-lines"><tbody>
       <tr><td>Year:</td><td><b>${props.year}</b></td></tr>
       <tr><td>Neighborhood:</td><td><b>${format(props.tree_cnt_uhf)}</b></td></tr>
       <tr><td>Borough:</td><td><b>${format(props.tree_cnt_boro)}</b></td></tr>
       </tbody></table>
        `
      : '<span>Hover over a neighborhood</span>');
  };

  info.addTo(map);
  var highlighted = []

  function highlightFeature(e) {
    let layer = e.target;
    layer.setStyle({
      weight: 3,
      color: 'purple',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    let layer = e.target
    geojson.resetStyle(layer);
    info.update();
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
    if (highlighted.length) {
      highlighted = highlighted.map(d => resetHighlight(d)).filter(d => false)
    }
    highlighted.push(e)
    highlightFeature(e)
  }


  function onEachFeature(feature, layer) {
    layer._leaflet_id = feature.properties.uhfcode
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  }

  /*
  //https://colorbrewer2.org/#type=sequential&scheme=Greens&n=9
  #f7fcf5  light
  #e5f5e0
  #c7e9c0
  #a1d99b
  #74c476
  #41ab5d
  #238b45
  #006d2c
  #00441b. dark
  */

  var getColor = (count) => {
    const colors = {
      '60663': '#C7E9C0',
      '82433': '#a1d99b',
      '98223': '#74c476',
      '126538': '#41ab5d',
      '133886': '#006d2c'
    }
    return colors[count]
  }

  function style(feature) {
    return {
      fillColor: getColor(feature.properties.tree_cnt_boro),
      weight: 2,
      opacity: 1,
      color: 'gray',
      dashArray: '3',
      fillOpacity: 0.9
    }
  }

  let geojson = L.geoJson(locations, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map)

  //addLegend()

  // Create a new marker cluster group
  let markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true
  });

  addOldestTree(map, markers)
  //addClusters(map, markers)
  //addTrees(map, markers)


}

function addLegend() {

  let legend = L.control({ position: "bottomright" });

  legend.onAdd = (map) => {
    let div = L.DomUtil.create("div", "info legend"),
      labels = [];

    boroughs.forEach(boro => labels.push('<i style="background:' + getBoroColor(boro) + '"></i> ' + boro));

    div.innerHTML = labels.join('<br/>');

    return div;
  };

  // Adding legend to the map
  legend.addTo(map);
}

//})


function addOldestTree(markers) {
  // Oldest Tree
  let orangeIcon = L.icon({
    iconUrl: 'flask-app/static/images/leaf-orange.png',
    shadowUrl: 'flask-app/static/images/leaf-shadow.png',

    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  //40.708175 -73.809574 
  const oldest = {
    lat: 40.708175,
    lng: -73.809574,
    common: "KING OF QUEENS",
    dbh: 2100,
    status: "Good Old Maple",
    marker: L.marker([40.708175, -73.809574], { icon: orangeIcon }).addTo(map)
  }

  oldest.marker.bindPopup(`<h6>${oldest.common}</h6>
<hr>
<table class="no-lines"><tbody>
<tr><td>DBH (cm):</td><td><b>${oldest.dbh}</b></td></tr>
<tr><td>Status:</td><td><b>${oldest.status}</b></td></tr>
</tbody></table>
`);
  markers.addLayer(oldest.marker);
}

function addClusters(markers) {

  let greenIcon = L.icon({
    iconUrl: 'flask-app/static/images/leaf-green.png',
    shadowUrl: 'flask-app/static/images/leaf-shadow.png',

    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  const treeData = 'flask-app/static/data/Trees.json';
  d3.json(treeData).then(trees => {
    let markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      removeOutsideVisibleBounds: true,
      //iconCreateFunction: function (cluster) {
      //  return L.divIcon({ html: '<b>' + cluster.getChildCount() + '</b>' });
      //}
    });

    trees.forEach(tree => {
      if (tree.latitude && tree.longitude) {
        let marker = L.marker([tree.latitude, tree.longitude], { icon: greenIcon });
        marker.bindPopup(`<h6>${tree.spc_common}</h6>
        <hr>
        <table class="no-lines"><tbody>
        <tr><td>DBH:</td><td><b>${tree.tree_dbh}</b></td></tr>
        <tr><td>Status:</td><td><b>${tree.status}</b></td></tr>
        </tbody></table>
        `);
        markers.addLayer(marker);
      }
      // Add our marker cluster layer to the map
      map.addLayer(markers)
    })
  }).catch(error => console.error(error))
}

addTrees = (map, markers) => {

  let greenIcon = L.icon({
    iconUrl: 'flask-app/static/images/leaf-green.png',
    shadowUrl: 'flask-app/static/images/leaf-shadow.png',

    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });
  const now = Date.now()
  const treeData = 'flask-app/static/data/tree_points.geojson';
  d3.json(treeData).then(trees => {
    console.log(`loaded ${trees.features.length} points JSON in ${(Date.now() - now) / 1000}s`);
    cluster = new Supercluster({
      radius: 40,
      maxZoom: 16,
      map: (props) => ({ sum: props.tree_dbh }),
      reduce: (accumulated, props) => { accumulated.sum += props.sum; }
    });
    cluster.load(trees.features)

  }).catch(error => console.error(error))
}

update = () => {
  if (!ready) return;
  var bounds = map.getBounds()
  var bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
  var zoom = map.getZoom()
  var clusters = cluster.getClusters(bbox, zoom)
  markers.clearLayers()
  markers.addData(clusters)
}
