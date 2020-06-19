document.addEventListener('DOMContentLoaded', function () {
  var elems = document.querySelectorAll('select')
  M.FormSelect.init(elems)
})
function onMapReady() {
  setTimeout(() => {
    map.invalidateSize();
  });
}

var boros = {
  'Bronx': '#ffffcc',
  'Queens': '#a1dab4',
  'Brooklyn': '#41b6c4',
  'Manhattan': '#2c7fb8',
  'Staten Island': '#253494'
}

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

demo = households.filter(d => d.Fips <= 1000 && d.DataFormat === 'Number' && d.TimeFrame >= 2015)

years = demo.map(d => d.TimeFrame).filter((v, i, a) => a.indexOf(v) === i).sort()

areas = demo.map(d => ({ fips: d.Fips, location: d.Location })).sort((a, b) => a.location > b.location).filter((v, i, a) => a.findIndex(e => e.fips === v.fips) === i)

boroughs = demo.map(d => d.Borough).filter((v, i, a) => a.indexOf(v) === i).sort()

levels = demo.map(d => d['Income Level']).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseFloat(b.split(' ')[0].split('$')[1]) - parseFloat(a.split(' ')[0].split('$')[1]))

var filters = d3.select('#filters')

var dropDown = filters
  .append('div').attr('class', 'input-field')
  .append('select')
  .attr('id', 'chooser')
  .on('change', onChange)

dropDown.append('option')
  .attr('value', 'None')
  .property('disabled', true)
  .property('selected', true)
  .text('Choose your option')

dropDown.selectAll(null)
  .data(areas)
  .enter()
  .append('option')
  .attr('value', d => d.fips)
  .text(d => d.location)

var incomeSelector = filters.append('form')

var incomeSelections = incomeSelector.selectAll('p')
  .data(levels.reverse())
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

function onChange() {
  let name = this.name ? this.name : 'select'
  let value = this.value;

  if (value === 'None') {
    console.error('Nothing selected')
  } else {
    console.log(`filter selected : ${name} - ${value}`)
  }
}
