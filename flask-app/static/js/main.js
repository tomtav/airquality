document.addEventListener('DOMContentLoaded', function () {
  var instances = [];
  var selectors = document.querySelectorAll('select');
  instances.push(M.FormSelect.init(selectors));

  var collapsibles = document.querySelectorAll('.collapsible');
  instances.push(M.Collapsible.init(collapsibles));

})

function onMapReady() {
  setTimeout(() => {
    map.invalidateSize();
  });
}

function getBoroColor(d) {
  const boros = {
    'Bronx': '#ffffcc',
    'Queens': '#a1dab4',
    'Brooklyn': '#41b6c4',
    'Manhattan': '#2c7fb8',
    'Staten Island': '#253494'
  }
  return boros[d] ? boros[d] : '#999'
}


const dataFile = 'flask-app/static/data/uhf_final_w_trees.geojson';
d3.json(dataFile).then(buildCharts);

function buildCharts(data) {
  createFilters(data);
  createTreeMap(data);
  createIncomeChart(data);
  createERmap(data);
}

function createFilters(data) {

  years = data.features.map(d => d.properties.year).filter((v, i, a) => a.indexOf(v) === i).sort()
  areas = data.features.map(d => ({ uhf_code: d.properties.uhfcode, uhf_neigh: d.properties.uhf_neigh })).sort((a, b) => a.uhf_neigh > b.uhf_neigh).filter((v, i, a) => a.findIndex(e => e.uhf_code === v.uhf_code) === i)
  boroughs = data.features.map(d => d.properties.borough).filter((v, i, a) => a.indexOf(v) === i).sort()
  levels = data.features.map(d => d.properties.income_level).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseFloat(b.split(' ')[0].split('$')[1]) - parseFloat(a.split(' ')[0].split('$')[1]))

  var filters = d3.select('#filters')
  addNeighborhoodDD(filters, areas);
  //addIncomeSelector(filters, levels);

}

function addNeighborhoodDD(container, data) {
  var inputField = container
    .append('div')

  inputField.classed('input-field col s12', true)

  let dropDown = inputField
    .append('select')
    .attr('id', 'chooser')
    .on('change', onChange)

  dropDown.append('option')
    .attr('value', '')
    .property('disabled', false)
    .property('selected', true)
    .text('All Neighborhoods')

  dropDown.selectAll(null)
    .data(data)
    .enter()
    .append('option')
    .attr('value', d => d.uhf_code)
    .text(d => d.uhf_neigh);

  inputField.append('label')
    .style('color', '#000')
    .style('font-size', '1.1em')
    .style('font-weight', 'bold')
    .text('Select a Neighborhood:')

  M.FormSelect.init(document.querySelectorAll('select'))

}

function addIncomeSelector(container, data) {
  var incomeSelector = container.append('div').append('form')
  incomeSelector.append('h6')
    .style('color', '#fff')
    .text('Income Level:')

  var incomeSelections = incomeSelector.selectAll('p')
    .data(data.reverse())
    .enter()
    .append('p')

  var incomeRadios = incomeSelections.append('label')

  incomeRadios.append('input')
    .attr('name', 'income_level')
    .attr('type', 'radio')
    .attr('value', d => d)
    .property('checked', (d, i) => i === 0)
    .on('change', onChange)

  incomeRadios.append('span')
    .style('color', '#fff')
    .text(d => d)

}


function onChange() {
  let name = this.name ? this.name : 'select'
  let value = this.value;

  if (value === '') {
    treeMapResetZoom()
    erMapResetZoom()
  } else {
    treeMapZoomToFeature(value)
    erMapZoomToFeature(value)
  }
}
