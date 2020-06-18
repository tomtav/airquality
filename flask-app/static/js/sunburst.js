var sunburst_data = { name: 'Incomes', children: [] }
d3.json('flask-app/static/data/uhf_final.geojson').then(data => {

  demo = data['features'].filter(d => d.properties.uhfcode <= 1000 && d.properties.year >= 2015)
  years = demo.map(d => d.properties.year).filter((v, i, a) => a.indexOf(v) === i).sort()
  boroughs = demo.map(d => d.properties.borough).filter((v, i, a) => a.indexOf(v) === i).sort()
  levels = demo.map(d => d.properties.income_level).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => parseFloat(b.split(' ')[0].split('$')[1]) - parseFloat(a.split(' ')[0].split('$')[1]))

  years.forEach(async year => {
    y = { "name": year, "children": [] }
    boroughs.forEach(b => {
      t = { "name": b, "children": [] }
      for (let level of levels) {
        l = { 'name': level, "children": [] }
        l.children = demo.filter(d => d.properties.borough === b && d.properties.income_level === level && d.properties.year === year).map(d => { d.properties.name = d.properties.uhf_neigh; d.properties.value = d.properties.households; return d.properties })
        l.value = demo.filter(d => d.properties.borough === b && d.properties.income_level === level && d.properties.year === year)
          .map(d => { d.properties.name = d.properties.uhf_neigh; return d.properties })
          .reduce((cnt, d) => cnt + d.households, 0)
        t.children.push(l)
      }
      t.value = t.children.reduce((cnt, d) => cnt + d.value, 0)
      y.children.push(t)
      y.value = y.children.reduce((cnt, d) => cnt + d.value, 0)
    })
    sunburst_data.children.push(y)
  })


  const width = 600;
  const height = 600;
  const radius = Math.min(width, height) / 6;
  //const color = d3.scaleOrdinal(d3.schemeDark2)
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateViridis, sunburst_data.children.length + 1))
  //const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, sunburst_data.children[0].children[0].children.length + 5))
  //const format = d3.format(",d")
  const format = d3.format('.0%')

  const q1 = d3.select('#question_1')
  q1.append('label').html('<input class="sizeSelect" type="radio" name="mode" value="count" checked /><span>Number of Households</span>')
  q1.append('label').html('<input class="sizeSelect" type="radio" name="mode" value="percent" /><span>Percentage of Households</span>')

  const svg = q1.append('svg')
    .attr('viewBox', [0, 0, width, height])
    .style('font', '10px sans-serif')

  const g = svg
    .append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`)

  const partition = data => {
    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);
    return d3.partition()
      .size([2 * Math.PI, root.height + 1])(root)
  }

  const root = partition(sunburst_data)
  console.log(root)
  root.each(d => d.current = d)

  const arc = d3.arc()
    .startAngle(function (d) { d.x0s = d.x0; return d.x0 })
    .endAngle(function (d) { d.x1s = d.x1; return d.x1 })
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  const path = g.append('g')
    .selectAll('path')
    .data(root.descendants().slice(1))
    .enter().append('path')
    .attr('fill', d => { while (d.depth > 1) d = d.parent; return color(d.data.name) })
    .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
    .attr('d', d => arc(d.current));

  path.filter(d => d.children)
    .style('cursor', 'pointer')
    .on('click', onClick);

  path.append('title')
    .text(d => `${d.ancestors().map(d => d.data.name).reverse().join('/')}\n${d.data.uhfcode ? format(d.data.value) : ''}`);

  const label = g.append('g')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .style('user-select', 'none')
    .selectAll('text')
    .data(root.descendants().slice(1))
    .enter().append('text')
    .attr('dy', '0.35em')
    .style('font-weight', d => labelVisible(d.current) ? 'bold' : 'normal')
    .attr('fill-opacity', d => +labelVisible(d.current))
    .attr('transform', d => labelTransform(d.current))
    .text(d => d.data.name)

  const parent = g.append('circle')
    .datum(root)
    .attr('r', radius)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('click', onClick)

  function onClick(p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    })

    const t = g.transition().duration(750);

    path.transition(t)
      .tween("data", d => {

        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function (d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attrTween("d", d => () => arc(d.current));

    label.filter(function (d) {
      return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    }).transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));

  }

  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

})
