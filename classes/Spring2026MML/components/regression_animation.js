import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function* regression_animation() {
  let a = d3.randomUniform(0.2, 1.2)();
  let b = d3.randomUniform(-1, 1)();
  let r = d3.randomNormal(0.5);
  let pts = d3.sort(
    d3.range(20).map(function () {
      const x = d3.randomUniform(-8, 8)();
      const y = a * x + b + r();
      return [x, y];
    }),
    (a) => a[0]
  );

  let pic = Plot.plot({
    width: 300,
    height: 300,
    x: { domain: [-8, 8], axis: null },
    y: { domain: [-8, 8], axis: null },
    marks: [
      Plot.dot(pts, {
        fill: (pt, i) => d3.schemeCategory10[i % 10],
        r: 5,
        opacity: 0
      }),
      Plot.linearRegressionY(pts, {
        x: (pt) => pt[0],
        y: (pt) => pt[1],
        strokeWidth: 2,
        ci: 0,
        opacity: 0
      }),
      Plot.ruleX([0], { strokeWidth: 0.5 }),
      Plot.ruleY([0], { strokeWidth: 0.5 })
    ]
  });
  yield pic;

  const d3pic = d3.select(pic);
  d3pic.selectAll("circle")
    .each(function (c, i) {
      delay(50 * i)
        .then(() =>
          d3.select(this).attr("opacity", 1)
        );
    });
  delay(20 * 50).then(function () {
    let path = d3pic
      .select("g[aria-label='linear-regression']")
      .select("path")
      .attr("opacity", 1);
    let length = path.node().getTotalLength();
    path
      .attr("stroke-dasharray", [0, length])
      .transition()
      .duration(800)
      .attr("stroke-dasharray", [length, length]);
  });
}

function delay(duration, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, duration);
  });
}
