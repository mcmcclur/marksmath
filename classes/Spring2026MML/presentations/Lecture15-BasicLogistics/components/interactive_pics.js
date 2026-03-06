import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function synthetic_logistic_pic() {
  const a = d3.randomUniform(0.5, 1.2)();
  const b = d3.randomUniform(-1,1)();
  const p = (x) => 1 / (1 + Math.exp(-(a * x + b)));
  const pts = d3.range(-8, 8, 0.1).map((x) => [x, p(x)]);

  const data = d3.range(200).map(function () {
    const x = d3.randomNormal(0, 3)();
    const y = d3.randomUniform(0, 1)() < p(x) ? 1 : 0;
    return { "x:": x, "Outcome:": y };
  });

  return Plot.plot({
    width: 800,
    height: 300,
    x: { domain: [-8, 8] },
    y: { domain: [-0.04, 1.04] },
    marks: [
      Plot.line(pts),
      Plot.dot(data, {
        x: "x:",
        y: "Outcome:",
        fill: "black",
        opacity: 0.3,
        tip: true,
        channels: {
          "x:": "x",
          "Outcome:": "Outcome:",
          "Prob:": (d) => p(d["x:"])
        }
      }),
      Plot.dot([{ x: -b / a, y: 1 / 2 }], { x: "x", y: "y", r: 5, fill: 'blue' }),
      Plot.ruleX([0]),
      Plot.ruleY([0]),
      Plot.axisY({ x: 0, ticks: 5 })
      // Plot.crosshairX(pts, { x: (d) => `${d[0]}`, y: (d) => d[1] })
    ]
  });
}