import {
  create,
  range,
  deviation
} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const d3 = {
  create,
  range,
  deviation
}
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";


export function make_massey_histogram(symmetric_game_data, show_normal = true) {
    const s = d3.deviation(symmetric_game_data, (o) => o.residual);
    const f = (x) => Math.exp(-(x ** 2) / (2 * s ** 2)) / Math.sqrt(2 * Math.PI * s ** 2);

    return Plot.plot({
    width: 900,
    height: 400,
    y: { domain: [0, 0.04] },
    marks: [
        Plot.rectY(
        symmetric_game_data,
        Plot.binX(
            {
            y: (a, bin) => {
                return a.length / symmetric_game_data.length / (bin.x2 - bin.x1);
            }
            },
            { x: "residual", thresholds: 20, fill: "steelblue" }
        )
        ),
        show_normal ? Plot.line(
            d3.range(-44, 44, 0.1).map((x) => [x, f(x)]),
            { strokeWidth: 4 }
        ): null,
        Plot.dot(symmetric_game_data, {
        x: "residual",
        y: -0.0005,
        r: 4,
        fill: "black",
        fillOpacity: 0.03,
        tip: true,
        channels: {
            "Team 1": "Team1Name",
            "Team 2": "Team2Name",
            "Score difference": (o) => o.Team1Score - o.Team2Score,
            "Massey difference": (o) => o.Team1MasseyRating - o.Team2MasseyRating
        }
        }),
        Plot.ruleY([0])
    ]
    })
}