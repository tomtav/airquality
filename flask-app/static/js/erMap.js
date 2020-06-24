var erMap, erLayer, erInfo;
var erMapHighlighted = []
const erMapDefault = {
  //center: [40.7484, -73.9997],
  center: [40.7484, -73.8857],
  zoom: 10
}
function erMapResetZoom() {
  if (erMapHighlighted.length) {
    erMapHighlighted = erMapHighlighted.map(d => erLayer.resetStyle(d.target)).filter(d => false)
  }
  erMap.setView(erMapDefault.center, erMapDefault.zoom)
  erInfo.update()
}

function erMapZoomToFeature(e) {
  var layer = erMap._layers[e]
  layer.fire('click')
  erMap.fitBounds(layer.getBounds())
}

function createERmap(data) {

  data.features = data.features.filter(d => d.properties.uhfcode <= 1000 && d.properties.year === 2015)
  const format = d3.format(',d')

  erMap = L.map('erMAP', { scrollWheelZoom: false }).setView(erMapDefault.center, erMapDefault.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(erMap);

  /* 
  const mapboxAccessToken = API_KEY;
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    id: 'mapbox/light-v10',
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1
  }).addTo(erMap); 
  */

  erInfo = L.control();

  erInfo.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };

  erInfo.update = function (props) {
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

  erInfo.addTo(erMap);
  let highlighted = []

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

    erInfo.update(layer.feature.properties);
  }

  function resetHighlight(e) {
    erLayer.resetStyle(e.target);
    erInfo.update();
  }

  function zoomToFeature(e) {
    erMap.fitBounds(e.target.getBounds());
    if (erMapHighlighted.length) {
      erMapHighlighted = erMapHighlighted.map(d => resetHighlight(d)).filter(d => false)
    }
    erMapHighlighted.push(e)
    highlightFeature(e)
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
    layer._leaflet_id = feature.properties.uhfcode
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
    //layer.bindPopup(tooltip);
  }

  let ev = data.features.map(d => d.properties.ervisits_count).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)

  let linearScale = d3.scaleLinear()
    .domain([d3.min(ev), d3.median(ev), d3.max(ev)])
    .range(['#006d2c', '#fed98e', '#de2d26']);

  let colorArray = ev.map(d => linearScale(d));

  erLayer = L.choropleth(data, {
    onEachFeature: onEachFeature,

    valueProperty: "ervisits_count",

    scale: colorArray,

    steps: 5,

    mode: "q",
    style: {
      color: "#006d2c",
      weight: 1,
      fillOpacity: 0.7
    }
  }).addTo(erMap);

  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function (erMap) {
    let div = L.DomUtil.create("div", "info legend"),
      limits = erLayer.options.limits,
      colors = erLayer.options.colors,
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
  legend.addTo(erMap);

}
