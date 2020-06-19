d3.json('flask-app/static/data/uhf_final_w_trees.geojson').then(data => {

  data.features = data.features.filter(d => d.properties.uhfcode <= 1000 && d.properties.year === 2015)

  let locations = data
  let format = d3.format(',d')

  let map = L.map('map', { scrollWheelZoom: false }).setView([40.6892, -74.0445], 10);

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

  function highlightFeature(e) {
    let layer = e.target;
    layer.setStyle({
      weight: 3,
      color: 'darkgreen',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }

    info.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    geojson.resetStyle(e.target);
    info.update();
  }

  function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
  }


  function onEachFeature(feature, layer) {
    /* let tooltip = "<h5>" + feature.properties.PO_NAME + " (" + feature.properties.postalCode + ")" +
      "</h5><hr><p>" + feature.properties.UHF_FIPS + " - " + feature.properties.UHF_NAME + "</p>";
    if (feature.properties.INCOME.length) {
      feature.properties.INCOME.forEach(income => {
        tooltip += "<p>" + income.level + " - " + income.amount + "</p>"
      })
    } */
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
    //layer.bindPopup(tooltip)
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

  let geojson = L.geoJson(locations, {
    style: style,
    onEachFeature: onEachFeature
  }).addTo(map)

  let greenIcon = L.icon({
    iconUrl: 'flask-app/static/images/leaf-green.png',
    shadowUrl: 'flask-app/static/images/leaf-shadow.png',

    iconSize: [38, 95], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });


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

  // Create a new marker cluster group
  let markers = L.markerClusterGroup({
    showCoverageOnHover: false,
    removeOutsideVisibleBounds: true
  });


  oldest_marker = L.marker([40.708175, -73.809574], { icon: orangeIcon }).addTo(map);
  //40.708175 -73.809574 
  const oldest_lat = 40.708175
  const oldest_lng = -73.809574
  const oldest_common = "MAPLE, NORWAY"
  const oldest_dbh = 2100
  const oldest_status = "Good Old Maple"
  oldest_marker.bindPopup(`<h3>${oldest_common}</h3>
<hr>
<p>DBH: ${oldest_dbh}</p>
<p>Status: ${oldest_status}</p>`);
  markers.addLayer(oldest_marker);

  const treeData = 'flask-app/static/data/Trees.json';
  /* d3.json(treeData).then(trees => {
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
  }).catch(error => console.error(error))
 */

})
