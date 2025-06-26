// It's a bit of pain in the ass to get the bubbles to 
// consistently lie within the viewbox. I'm also unsure why
// I can't seem to get overflow: visible to work.

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import tippyJs from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm';

export function make_force_animation(courses) {
    const data = d3
    .rollups(
      courses,
      function (a) {
        const [xmin, xmax, ymin, ymax] = [-30, 30, -10, 10];
        const x0 = 4*d3.randomUniform(xmin, xmax)();
        const y0 = 2*d3.randomUniform(ymin, ymax)();
        return {
          title: a[0].Title,
          count: a.length,
          code: a[0].Code.split(".")[0],
          x0,
          y0,
          x: x0,
          y: y0
        };
      },
      (o) => o.Title
    )
    .map((a) => a[1]);

    const width = 800;
    const height = 300;

  const simulation = d3
    .forceSimulation(data)
    .force(
      "charge",
      d3.forceManyBody().strength((d) => Math.sqrt(d.count) / 4)
    )
    .force("centerx", d3.forceX().strength(0.1))
    .force("centery", d3.forceY().strength(0.4))
    .force(
      "collision",
      d3
        .forceCollide()
        .radius(function (d) {
          return Math.sqrt(d.count);
        })
        .strength(0.5)
    );

    // const [xmin, xmax, ymin, ymax] = [-30, 30, -10, 10];
    let svg = d3.create("svg")
    let g = svg.append("g");

    let circs = g
        .selectAll("circle")
        .attr("fill", "black")
        .data(data)
        .join("circle")
        .attr("cx", (c) => c.x)
        .attr("cy", (c) => c.y)
        .attr("r", (c) => 0.95 * Math.sqrt(c.count))
        .attr("fill", "steelblue")
        .attr("stroke", "black")
        .attr("stroke-width", 0.1);

    simulation.on("tick", function () {
        circs.attr("cx", (c) => c.x).attr("cy", (c) => c.y);
    });
    simulation.tick(800);
    let [xmin,xmax] = d3.extent(data, (d) => d.x);
    let [ymin,ymax] = d3.extent(data, (d) => d.y);
    xmin = xmin - 20;
    xmax = xmax + 25;
    ymin = ymin - 3;
    ymax = ymax + 3;
    svg
        .attr("viewBox", [xmin, ymin, xmax - xmin, ymax - ymin])
        .style("max-width", "100%")

    data.forEach(function (o) {
        o.x = o.x0;
        o.y = o.y0
    });

    simulation.alpha(1).alphaMin(0.000000001).alphaDecay(0.1);
    simulation.restart();

    return svg.node();

}