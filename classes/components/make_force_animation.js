import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import tippyJs from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm';

export function make_force_animation(courses) {
    const data = d3
    .rollups(
      courses,
      function (a) {
        return {
          title: a[0].Title,
          count: a.length,
          code: a[0].Code.split(".")[0]
          // x: (0.2 + 0.6 * Math.random()) * width,
          // y: (0.2 + 0.6 * Math.random()) * height
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

    const [xmin, xmax, ymin, ymax] = [-30, 30, -10, 10];
    let svg = d3
        .create("svg")
        .attr("viewBox", [xmin, ymin, xmax - xmin, ymax - ymin])
        .style("max-width", "100%")
        .style("border", "solid 1px black")
        .style("overflow", "visible");
    let g = svg.append("g");

    let circs = g
        .selectAll("circle")
        .attr("fill", "black")
        .data(data)
        .join("circle")
        .attr("cx", (c) => c.x)
        .attr("cy", (c) => c.y)
        .attr("r", (c) => 0.95 * Math.sqrt(c.count))
        .attr("fill", "lightgray")
        .attr("stroke", "black")
        .attr("stroke-width", 0.1);

    simulation.on("tick", function () {
        circs.attr("cx", (c) => c.x).attr("cy", (c) => c.y);
    });
    simulation.tick(300);

    data.forEach(function (o) {
        o.x = 4 * d3.randomUniform(xmin, xmax)();
        o.y = 1 * d3.randomUniform(ymin, ymax)();
    });

    simulation.alpha(1).alphaMin(0.000000001).alphaDecay(0.1);
    simulation.restart();

    return svg.node();

}