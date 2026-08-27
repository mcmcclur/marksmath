import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function just_graph() {
  const f = x => x**2;
  const pts = d3.range(-2,2,0.01).map(x => [x,f(x)]);
  return Plot.plot({
    x: {domain: [-2.2,2.2]},
    y: {domain: [-0.2,4.2]},
    marks: [
      Plot.line(pts),
      Plot.ruleX([0]),
      Plot.ruleY([0]),
      Plot.axisY({x:0})
    ]
  })
}

export function graph_with_points() {
  const f = x => x**2;
  const pts = d3
    .range(-0.1,2.1,0.01)
    .map(x => [x,f(x)]);
  const xs = d3
    .range(0,2.01,0.1);
  const xpts = xs.map(x => [x,0]);
  const ypts = xs.map(x => [0,f(x)]);
  const xy_pts = xs.map(x => [x,f(x)]);


  return Plot.plot({
    x: {domain: [-0.2,2.2]},
    y: {domain: [-0.2,4.2]},
    marks: [
      Plot.line(pts),
      Plot.dot(xpts, {
        r: 3,
        fill: 'currentColor'
      }),
      Plot.dot(ypts, {
        r: 3,
        fill: 'currentColor'
      }),
      Plot.dot(xy_pts, {
        r: 3,
        fill: 'currentColor'
      }),
      Plot.ruleX([0]),
      Plot.ruleY([0]),
      Plot.axisY({x:0})
    ].concat(
      d3.zip(xpts,xy_pts,ypts)
        .map(a => Plot.line(a, {strokeWidth: 0.5}))
      )
  })
}

export function make_lineland() {
  const [xmin,xmax, ymin,ymax] = [-0.2,4.2, -0.2,0.2];
  const w = 640;
  const h = (ymax-ymin)*600/(xmax-xmin);
  const x_scale = d3.scaleLinear()
    .domain([xmin,xmax])
    .range([0,w]);
  const y_scale = d3.scaleLinear()
    .domain([ymin,ymax])
    .range([0,h]);
  const r_scale = d3.scaleLinear()
    .domain([0,xmax-xmin])
    .range([0,w])

  const svg = d3.create('svg')
    .attr('viewBox', [0,0,w,h])
    .style('max-width', `${w}px`);

  svg
    .append("g")
    .attr("transform", `translate(0, ${y_scale(0)})`)
    .call(d3.axisBottom(x_scale).tickSizeOuter(0));

  const pts = d3.range(0,2.01,0.1);
  const circles = svg.append('g');
  circles.selectAll('circle')
    .data(pts)
    .join('circle')
    .attr('cx', x_scale)
    .attr('cy', y_scale(0))
    .attr('r', r_scale(0.03))
    .attr('fill', 'currentColor');

  svg.node().update = update
  return svg.node();


  function update(s) {
    if(s%2 == 1) {
      circles.selectAll('circle')
        .transition()
        .duration(750)
        .attr('cx', x => x_scale(x**2))
    } else {
      circles.selectAll('circle')
        .transition()
        .duration(750)
        .attr('cx', x => x_scale(x));
    }
  } 
}