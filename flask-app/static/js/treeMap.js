var cluster;
var ready = false;
var treeMap, treeLayer, treeInfo;
var treeMapHighlighted = []
const treeMapDefault = {
  //center: [40.6892, -74.0445],
  center: [40.7484, -73.8857],
  zoom: 10
}
function treeMapResetZoom() {
  if (treeMapHighlighted.length) {
    treeMapHighlighted = treeMapHighlighted.map(d => treeLayer.resetStyle(d.target)).filter(d => false)
  }
  treeMap.setView(treeMapDefault.center, treeMapDefault.zoom)
  treeInfo.update()
}

function treeMapZoomToFeature(e) {
  var layer = treeMap._layers[e]
  layer.fire('click')
  treeMap.fitBounds(layer.getBounds())
}


function createTreeMap(data) {

  let boros = data.features.map(d => ({ name: d.properties.borough, count: d.properties.tree_cnt_boro })).filter((v, i, a) => a.findIndex(e => e.name === v.name) === i).sort((a, b) => b.count - a.count)

  let locations = data
  const format = d3.format(',d')

  treeMap = L.map('treeMAP', { scrollWheelZoom: false }).setView(treeMapDefault.center, treeMapDefault.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(treeMap);

  /* 
    const mapboxAccessToken = API_KEY;
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(treeMap); 
  */

  treeInfo = L.control();

  treeInfo.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  treeInfo.update = function (props) {
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

  treeInfo.addTo(treeMap);

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
    treeInfo.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    let layer = e.target
    treeLayer.resetStyle(layer);
    treeInfo.update();
  }

  function zoomToFeature(e) {
    treeMap.fitBounds(e.target.getBounds());
    if (treeMapHighlighted.length) {
      treeMapHighlighted = treeMapHighlighted.map(d => resetHighlight(d)).filter(d => false)
    }
    treeMapHighlighted.push(e)
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

  treeLayer = L.geoJson(locations, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(treeMap)

  // Create a new marker cluster group
  let markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true
  });

  addOldestTree(markers)
  addLegend(boros)
  addClusters()
  //addTrees(map, markers)


}

getColor = (count) => {
  const colors = {
    '60663': '#C7E9C0',
    '82433': '#a1d99b',
    '98223': '#74c476',
    '126538': '#41ab5d',
    '133886': '#006d2c'
  }
  return colors[count]
}

addLegend = (boros) => {

  let legend = L.control({ position: "bottomright" });

  legend.onAdd = (map) => {
    let div = L.DomUtil.create("div", "info legend"),
      labels = [];

    boros.forEach(boro => labels.push('<i style="background:' + getColor(boro.count) + '"></i> ' + boro.name));

    div.innerHTML = labels.join('<br/>');

    return div;
  };

  // Adding legend to the map
  legend.addTo(treeMap);
}

addOldestTree = (markers) => {
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
    marker: L.marker([40.708175, -73.809574], { icon: orangeIcon }).addTo(treeMap)
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

addClusters = () => {

  let greenIcon = L.icon({
    iconUrl: 'flask-app/static/images/leaf-green.png',
    shadowUrl: 'flask-app/static/images/leaf-shadow.png',

    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  const treeDir = 'flask-app/static/data/';
  const treeFiles = ['trees_1.geojson', 'trees_2.geojson', 'trees_3.geojson']


  const progress = d3.select('.progress');
  const progressBar = d3.select('.determinate');

  function updateProgressBar(processed, total, elapsed, layersArray) {
    if (elapsed > 1000) {
      progress.style('display', 'block');
      progressBar.style('width', Math.round(processed / total * 100) + '%');
    }

    if (processed === total) {
      progress.style('display', 'none');
    }
  }

  let cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true,
    chunkedLoading: true,
    chunkProgress: updateProgressBar
  })
  let markerList = [];

  treeFiles.forEach(async (file) => {

    trees = await d3.json(treeDir + file)

    for (let i = 0; i < trees.length; i++) {
      let tree = trees[i]

      if (tree.latitude && tree.longitude) {
        let marker = L.marker([tree.latitude, tree.longitude], { icon: greenIcon, title: tree.spc_common })
        marker.bindPopup(`
                        <h6>${tree.spc_common}</h6>
                        <hr>
                        <table class="no-lines"><tbody>
                        <tr><td>DBH (cm):</td><td><b>${tree.tree_dbh}</b></td></tr>
                        <tr><td>Status:</td><td><b>${tree.health}</b></td></tr>
                        </tbody></table>
                      `);
        markerList.push(marker)
      }
    }

    // Add our markers to the marker cluster
    cluster.addLayers(markerList);

  })
  // Add our marker cluster layer to the map
  treeMap.addLayer(cluster)
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
