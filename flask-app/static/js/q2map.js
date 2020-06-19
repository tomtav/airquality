d3.json('flask-app/static/data/uhf_final_w_trees.geojson').then(data => {

  data.features = data.features.filter(d => d.properties.uhfcode <= 1000 && d.properties.year === 2015)

  let format = d3.format(',d')

  let map2 = L.map('map2', { scrollWheelZoom: false }).setView([40.7484, -73.9857], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map2);

  /* 
  const mapboxAccessToken = API_KEY;
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(map2); 
  */

  let info = L.control();

  info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  info.update = function (props) {
    this._div.innerHTML = '<h6>NYC Children Asthma ER Visits</h6>' + (props ?
      `<b>${props.uhf_neigh} (${props.borough})</b><br/>
       <table class="no-lines"><tbody>
       <tr><td>Year:</td><td><b>${props.year}</b></td></tr>
       <tr><td>Age Group:</td><td><b>${props.age}</b></td></tr>
       <tr><td>Visits:</td><td><b>${format(props.ervisits_count)}</b></td></tr>
       <tr><td>Trees:</td><td><b>${format(props.tree_cnt_uhf)}</b></td></tr>
       </tbody></table>
        `
      : '<span>Hover over a neighborhood</span>');
  };

  info.addTo(map2);

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
    geojson.resetStyle(e.target);
    info.update();
  }

  function zoomToFeature(e) {
    map2.fitBounds(e.target.getBounds());
  }

  function onEachFeature(feature, layer) {
    /* let tooltip = "<h5>" + feature.properties.borough + " (" + feature.properties.uhf_neigh + ")" +
      "</h5><hr><p>" + "Er Visits : " + feature.properties.ervisits + "</p>" +
      "</h5><hr><p>" + "Age : " + feature.properties.age + "</p>" +
      "</h5><hr><p>" + "Year : " + feature.properties.year + "</p>";
    if (feature.properties.ervisits.length) {
      feature.properties.ervisits.forEach(income => {
        tooltip += "<p>" + income.level + " - " + format(income.amount) + "</p>"
      })
    } */
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
    //layer.bindPopup(tooltip);


  }

  let geojson = L.choropleth(data, {
    onEachFeature: onEachFeature,

    valueProperty: "ervisits_count",

    scale: [
      "#ffffcc",
      "#c2e699",
      "#78c679",
      "#31a354",
      "#006837",
    ].reverse(),

    steps: 5,

    mode: "q",
    style: {
      color: "#006d2c",
      weight: 1,
      fillOpacity: 0.7
    }
  }).addTo(map2);

  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map2) {
    let div = L.DomUtil.create("div", "info legend"),
      limits = geojson.options.limits,
      colors = geojson.options.colors,
      labels = [],
      from, to, range_str;

    limits.forEach((limit, index) => {

      if (index === 0) {
        to = parseFloat(limits[index]).toFixed(0);
        range_str = "< " + format(to);
      }
      else {
        from = parseFloat(limits[index - 1]).toFixed(0);
        to = parseFloat(limits[index]).toFixed(0);
        range_str = format(from) + ((index + 1 === limits.length) ? '+' : ' - ' + format(to));
      }

      labels.push(
        '<i style="background:' + colors[index] + '"></i> ' + range_str);

    });

    div.innerHTML = labels.join('<br/>');

    return div;
  };

  // Adding legend to the map
  legend.addTo(map2);

})
