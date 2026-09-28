import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import {delay} from "/components/delay.js";

export async function plots_with_dots(fs, state) {
  const width = 650;
  const height = width * 4.7/7.2;
  const marks = [
      Plot.axisX({y:0, ticks: [-4,-3,-2,-1,1,2,3,4]}),
      Plot.axisY({x:0, ticks: [1,2,3,4], tickFormat: y=>y}),
      Plot.ruleX([0]),
      Plot.ruleY([0])
  ];

  function addPlot(fString, o) {
    let f, color;
    if(fString == "2^x") {
      f = x => 2**x;
      color = 'steelblue';
    }
    else if(fString == "e^x") {
      f = x => Math.exp(x);
      color = 'red';
    }
    else if(fString == "3^x") {
      f = x => 3**x;
      color = 'green';
    }
    const pts = d3.range(-4,4.1,1).map(x => [x,f(x)]);
    const line = d3.range(-4.1,4.1,0.01).map(x => [x,f(x)]);
    marks.push(Plot.line(line, {stroke: color, opacity: o}));
    marks.push(Plot.dot(pts, {fill: color, r:4, opacity: o}));
  }

  let fNew;
  if(fs.length > state.length) {
    fNew = fs.filter(x => !state.includes(x))[0];
    await delay().then(
      async function() {
        addPlot(fNew, 0);
        state.forEach(f => addPlot(f,1));
      }
    )
  }
  if(fs.length < state.length) {
    await delay().then(
      async function() {
        fs.forEach(f => addPlot(f,1));
      }
    ).then(function() {
        const fOld = state.filter(x => !fs.includes(x))[0];
        const i = state.indexOf(fOld);
        if (i >= 0) {
          state.splice(i, 1)
        }
    })
  }

  const plot = Plot.plot({
      width, height, grid: true,
      margin: 0,
      y: {domain: [-0.3,4.4], ticks: [1,2,3,4]},
      x: {domain: [-4.1,3.1], ticks: [-4,-3,-2,-1,1,2,3]},
      marks
    });

  if(fs.length > state.length) {
    d3.select(plot)
      .select('g[aria-label="dot"]')
      .selectAll('circle')
      .attr('opacity', 0)
      .each(function(c,i) {
        delay(100*i).then(
          () => d3.select(this).attr('opacity', 1)
        )
      });
    delay(800).then(
      function() {
        const curve = d3.select(plot)
          .select('g[aria-label="line"]')
          .select('path');
        const length = curve.node().getTotalLength();
        curve
          .attr("stroke-dasharray", [0, length])
          .attr('opacity', 1)
          .transition()
          .duration(800)
          .attr("stroke-dasharray", [length, length]);
        }
    ).then(() => state.push(fNew))
  }

  return plot;
}


export function plots_with_slopes(parameters, h) {
  const ptse = d3.range(-4.1,4.1,0.01).map(x => [x,Math.exp(x)]);
  const pts2 = d3.range(-4.1,4.1,0.01).map(x => [x,2**x]);
  const pts3 = d3.range(-4.1,4.1,0.01).map(x => [x,3**x]);
  const width = 650;
  const height = width * 4.7/8.2;

  const marks = [
      Plot.axisX({y:0, ticks: [-4,-3,-2,-1,1,2,3,4]}),
      Plot.axisY({x:0, ticks: [1,2,3,4], tickFormat: y=>y}),
      Plot.ruleX([0]),
      Plot.ruleY([0])
  ];

  if(parameters[0]) {
    marks.push(Plot.line(pts2, {stroke: 'steelblue'}));
    const m2 = (2**h - 1)/h;
    const l2 = x => m2*x+1;
    marks.push(Plot.line([[-4,l2(-4)],[4,l2(4)]], {stroke: 'steelblue'}));
    marks.push(Plot.dot([[h,l2(h)]], {fill: 'steelblue', r:5}))
  }
  if(parameters[1]) {
    marks.push(Plot.line(pts3, {stroke: 'green'}));
    const m3 = (3**h - 1)/h;
    const l3 = x => m3*x+1;
    marks.push(Plot.line([[-4,l3(-4)],[4,l3(4)]], {stroke: 'green'}));
    marks.push(Plot.dot([[h,l3(h)]], {fill: 'green', r:5}))}
  if(parameters[2]) {
    marks.push(Plot.line(ptse, {stroke: 'red'}));
    const me = (Math.exp(h) - 1)/h;
    const le = x => me*x+1;
    marks.push(Plot.line([[-4,le(-4)],[4,le(4)]], {stroke: 'red'}));
    marks.push(Plot.dot([[h,le(h)]], {fill: 'red', r:5}))
  }
  marks.push(Plot.dot([[0,1]], {fill: 'black', r:4}))

  const plot = Plot.plot({
      width, height, grid: true,
      margin: 0,
      y: {domain: [-0.3,4.4], ticks: [1,2,3,4]},
      x: {domain: [-4.1,4.1], ticks: [-4,-3,-2,-1,1,2,3,4]},
      marks
    });

  return plot
}

export function simple_plot(b) {
  const width = 650;
  const height = width * 4.7/7.2;
  const marks = [
      Plot.axisX({y:0, ticks: [-4,-3,-2,-1,1,2,3,4]}),
      Plot.axisY({x:0, ticks: [1,2,3,4], tickFormat: y=>y}),
      Plot.ruleX([0]),
      Plot.ruleY([0])
    ];
    const line = d3.range(-4.1,4.1,0.01).map(x => [x,b**x]);
    marks.push(Plot.line(line, {stroke: 'steelblue', strokeWidth: 3}));
  const plot = Plot.plot({
      width, height, grid: true,
      margin: 0,
      y: {domain: [-0.3,4.4], ticks: [1,2,3,4]},
      x: {domain: [-4.1,3.1], ticks: [-4,-3,-2,-1,1,2,3]},
      marks
    });

  return plot
}

