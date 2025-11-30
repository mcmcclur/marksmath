import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import {delay} from '/components/delay.js';


export function harmonic(h) {
  let marks = d3.range(1, 13).map(function (n) {
    return Plot.line(
      d3
        .range(0, Math.PI + Math.PI / 800, Math.PI / 400)
        .map((x) => [x, Math.sin(n * x)]),
      { strokeWidth: n == h ? 2 : 0.2 }
    );
  });
  marks = marks.concat([
    Plot.ruleX([0]),
    Plot.ruleY([0]),
    Plot.axisX({
      y: 0,
      ticks: [Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, Math.PI],
      tickFormat: (x, i) =>
        i == 0 ? "π/3" : i == 3 ? "π" : i == 2 ? "2π/3" : "π/2"
    })
  ]);

  return Plot.plot({
    y: { ticks: [-1, 1], tickFormat: Math.round },
    width: 750,
    height: 250,
    marks
  });
}

export async function* vibration(mode) {
  let t = 0;
  while (true) {
    await delay(10);
    const pts = d3
      .range(0, Math.PI + Math.PI / 200, Math.PI / 200)
      .map(function (x) {
        return [x, Math.cos((mode * t) / 30) * Math.sin(mode * x)];
      });
    t = t + 1;
    yield Plot.plot({
      y: { domain: [-1.05, 1.05], ticks: [-1, 0, 1], tickFormat: Math.round },
      marks: [
        Plot.line(pts),
        Plot.axisX({ y: 0, ticks: [Math.PI], tickFormat: () => "π" }),
        Plot.ruleX([0]),
        Plot.ruleY([0])
      ]
    });
  }
}

export function fourier_pic(N) {
  const f = (x) =>
    d3.sum(
      d3
        .range(0, N)
        .map((n) => (4 * Math.sin((2 * n + 1) * x)) / ((2 * n + 1) * Math.PI))
    );
  return Plot.plot({
    y: { domain: [0, 1.3], ticks: [0.2, 0.4, 0.6, 0.8, 1] },
    x: {
      ticks: [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI],
      tickFormat: (x, i) =>
        i == 0 ? "π/4" : i == 3 ? "π" : i == 2 ? "3π/4" : "π/2"
    },
    marks: [
      Plot.line(
        d3.range(0, Math.PI + Math.PI / 1000, Math.PI / 1000).map(function (x) {
          return [x, f(x)];
        }),
        { strokeWidth: 2.5 }
      ),
      Plot.ruleX([0]),
      Plot.ruleY([0, 1])
    ]
  });
}
