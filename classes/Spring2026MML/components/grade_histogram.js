import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import tippyJs from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm';


const color = d3
  .scaleOrdinal()
  .domain(["F", "D", "C", "B", "A"])
  .range(d3.schemeRdBu[5]);
function tip_content(fill) {
  if (fill == "#0571b0") {
    return "A: Cutoff is 101 points or 90%";
  } else if (fill == "#92c5de") {
    return "B: Cutoff is 85 points or 75%";
  } else if (fill == "#f7f7f7") {
    return "C: Cutoff is 70 points or 62%";
  } else if (fill == "#ca0020") {
    return "F: Looking for 56 points or 50%";
  }
}

export function* grade_histogram(data) {
  const plot = Plot.plot({
    width: 500,
    height: 300,
    y: { grid: true, ticks: 5 },
    marks: [
      Plot.rectY(
        data,
        Plot.binX(
          { y: "count" },
          {
            x: { value: "Total points", thresholds: d3.range(45, 120, 10) },
            stroke: "black",
            strokeWidth: 1,
            fill: (o) => color(o.grade)
          }
        )
      ),
      Plot.ruleY([0])
    ]
  });

  const yScale = plot.scale("y");
  yield plot;

  d3.select(plot)
    .selectAll("rect")
    .attr("y0", function (a, b, c) {
      return d3.select(this).attr("y");
    })
    .attr("h0", function () {
      return d3.select(this).attr("height");
    })
    .attr("data-tipContent", function () {
      return tip_content(d3.select(this).attr("fill"));
    })
    .attr("y", yScale.apply(0))
    .attr("height", 0)
    .on("pointerenter", function () {
      d3.select(this).attr("stroke-width", 3).raise();
    })
    .on("pointerleave", function () {
      d3.select(this).attr("stroke-width", 1);
    })
    .transition()
    .duration(450)
    .attr("y", function () {
      return d3.select(this).attr("y0");
    })
    .attr("height", function () {
      return d3.select(this).attr("h0");
    })
    .each(function () {
      tippyJs(this, {
        content: this.getAttribute("data-tipContent"),
        theme: "light-border"
      });
    });
}
