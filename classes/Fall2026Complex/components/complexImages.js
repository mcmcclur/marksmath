import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { create, all } from 'https://esm.sh/mathjs'
const math = create(all);

function complexFunction(expr) {
  const compiled = math.parse(expr).compile()
  return z => compiled.evaluate({ z })
}


export function complexCartesianPlot(fString, [a,b], [c,d], opts = {}) {
  const {
    xres = 0.001,
    yres = 0.001,
    width = 500,
  } = opts;
  const f = complexFunction(fString);
  const points = d3.range(a,b+xres/2,xres)
    .map(x => d3.range(c,d+yres/2,yres)
    .map(y => [x,y]))
    .flat();
  const pointData = points.map(function([x,y]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im
    })
  });

  const xgrid = d3.range(a,b+(b-a)/100, (b-a)/10)
    .map(x => d3.range(c,d+yres/2, yres).map(y => [x,y])).flat();
  const ygrid = d3.range(c,d+(d-c)/100, (d-c)/10)
    .map(y => d3.range(a,b+xres/2, xres).map(x => [x,y])).flat();

  const wReGrid = xgrid.map(function([x,y]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im
    })
  });
  const wImGrid = ygrid.map(function([x,y]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im
    })
  });
return Plot.plot({
  margin: 40,
  aspectRatio: 1,
  width,
  marks: [
    Plot.raster(pointData, {x: 'Re', y: 'Im', fill: d => d.x}),
    Plot.line(wReGrid, {x: 'Re', y: 'Im', z: 'x'}),
    Plot.line(wImGrid, {x: 'Re', y: 'Im', z: 'y'}),
    Plot.axisX({y:0}), Plot.axisY({x:0}),
    Plot.ruleX([0]), Plot.ruleY([0])
  ]})
}

export function complexPolarPlot(fString, [a,b], [alpha, beta], opts = {}) {
  const {
    rRes = 0.001,
    tRes = 0.001,
    width = 500,
  } = opts;
  const f = complexFunction(fString);
  const points = d3.range(a,b+rRes/2,rRes)
    .map(r => d3.range(alpha,beta+tRes/2,tRes)
    .map(t => [r*Math.cos(t), r*Math.sin(t), r]))
    .flat();
  const pointData = points.map(function([x,y, r]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im, r
    })
  });

  const rgrid = d3.range(a,b+(b-a)/100, (b-a)/10)
    .map(r => d3.range(alpha,beta+tRes/2, tRes).map(t => [r*Math.cos(t), r*Math.sin(t)])).flat();
  const tgrid = d3.range(alpha,beta+(beta-alpha)/100, (beta-alpha)/10)
    .map(t => d3.range(a,b+rRes/2, rRes).map(r => [r*Math.cos(t), r*Math.sin(t)])).flat();

  const wRGrid = rgrid.map(function([x,y]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im
    })
  });
  const wTGrid = tgrid.map(function([x,y]) {
    const z = math.complex(x,y);
    const w = f(z);
    return ({
      x, y, Re: w.re, Im: w.im
    })
  });
return Plot.plot({
  margin: 40,
  aspectRatio: 1,
  width,
  marks: [
    Plot.raster(pointData, {x: 'Re', y: 'Im', fill: 'r'}),
    Plot.line(wRGrid, {x: 'Re', y: 'Im', z: 'x'}),
    Plot.line(wTGrid, {x: 'Re', y: 'Im', z: 'y'}),
    Plot.axisX({y:0}), Plot.axisY({x:0}),
    Plot.ruleX([0]), Plot.ruleY([0])
  ]})
}
