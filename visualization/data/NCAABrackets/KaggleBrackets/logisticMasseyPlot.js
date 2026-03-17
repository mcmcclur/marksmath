import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";


export function logisticMasseyPlot(data) {
//   const flipped_data = raw_data.map(function (o) {
//     const oo = {};
//     oo.Season = o.Season;
//     oo.Team1 = o.Team2;
//     oo.Team2 = o.Team1;
//     oo.RatingDiff = -o.RatingDiff;
//     oo.Team1Win = 1-o.Team1Win
//     return oo;
//   });
//   const data = raw_data// .concat(flipped_data);


//   const logreg = (x) => 1 / (1 + Math.exp(-0.198 * x));
  const logreg = (x) => 1 / (1 + Math.exp(-0.10729123 * x));
  const pts = d3.range(-40, 40, 0.1).map((x) => [x, logreg(x)]);
  const marks = [
    Plot.ruleY([0]),
    Plot.axisY({ x: 0, ticks: 5 }),
    Plot.ruleX([0]),
    Plot.dot(data, {
      x: "RatingDiff",
      y: "Team1Win",
      fill: "currentColor",
      r: 3,
      opacity: 0.07,
      tip: true,
      channels: {
        "Season": d => d.Season.toString(),
        "Team 1:": "Team1",
        "Team 2:": "Team2"
      }
    }),
    Plot.line(pts)
  ];

  return Plot.plot({
    width: 800,
    height: 300,
    x: { domain: [-40, 40] },
    marks
  })
}
