var sunburst_data = { name: 'Incomes', children: [] }

years.forEach(year => {
  y = { "name": year, "children": [] }
  boroughs.forEach(b => {
    t = { "name": b, "children": [] }
    for (let level of levels) {
      l = { 'name': level, "children": [] }
      l.children = demo.filter(d => d.Borough === b && d['Income Level'] === level && d.TimeFrame === year).map(d => { d.name = d.Location; return d })
      t.children.push(l)
    }
    y.children.push(t)
  })
  sunburst_data.children.push(y)
})

var width = 800;
var height = 800;
var radius = Math.min(width, height) / 2;
var color = d3.scaleOrdinal(d3.schemeCategory10);

var q1 = d3.select('#question_1')
q1.append('label').html('<input class="sizeSelect" type="radio" name="mode" value="count" checked /><span>Number of Households</span>')
q1.append('label').html('<input class="sizeSelect" type="radio" name="mode" value="percent" /><span>Percentage of Households</span>')
var svg = q1.append('svg');
var g = svg.attr('width', width)
  .attr('height', height)
  .append('g')
  .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')

var partition = d3.partition().size([2 * Math.PI, radius])
var root = d3.hierarchy(sunburst_data)
  .sum(function (d) { return d.Data })

partition(root)
var arc = d3.arc()
  .startAngle(function (d) { d.x0s = d.x0; return d.x0 })
  .endAngle(function (d) { d.x1s = d.x1; return d.x1 })
  .innerRadius(function (d) { return d.y0 })
  .outerRadius(function (d) { return d.y1 })

var slice = g.selectAll('g')
  .data(root.descendants())
  .enter()
  .append('g')
  .attr('class', 'node')

slice.append('path')
  .attr('display', function (d) { return d.depth ? null : 'none' })
  .attr('d', arc)
  .style('stroke', '#fff')
  .style('fill', function (d) { return color((d.children ? d : d.parent).data.name) })

g.selectAll('.node')
  .append('text')
  .attr('transform', function (d) {
    return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"
  })
  .attr("dx", "-20")
  .attr("dy", ".5em")
  .text(function (d) {
    return d.parent ? d.data.name : ""
  })

function computeTextRotation(d) {
  var angle = (d.x0 + d.x1) / Math.PI * 90;

  //return (angle < 90 || angle > 270) ? angle : angle + 180;
  return (angle < 120 || angle > 270) ? angle : angle + 180;  // labels as rims
  //return (angle < 180) ? angle - 90 : angle + 90; // labels as spokes
}

d3.selectAll('.sizeSelect')
  .on('click', function (d, i) {
    console.log('selector : ', this.value)
    if (this.value === 'number') {
      root.sum(d => d.Data)
    } else {
      root.count()
    }
    root.sort((a, b) => b.value - a.value)

    partition(root)

    slice.selectAll('path')
      .transition()
      .duration(750)
      .attrTween('d', arcTweenPath)

    slice.selectAll('text')
      .transition()
      .duration(750)
      .attrTween('transform', arcTweenText)
  })

function arcTweenPath(a, i) {
  var oi = d3.interpolate({ x0: a.x0s, x1: a.x1s }, a)
  function tween(t) {
    var b = oi(t)
    a.x0s = b.x0;
    a.x1s = b.x1;
    return arc(b);
  }
  return tween;
}

function arcTweenText(a, i) {
  var oi = d3.interpolate({ x0: a.x0s, x1: a.x1s }, a)
  function tween(t) {
    var b = oi(t)
    return 'translate(' + arc.centroid(b) + ')rotate(' + computeTextRotation(b) + ')'
  }
  return tween
}
