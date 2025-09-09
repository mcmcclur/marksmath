import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function make_one_step_transition_pic(M) {
  let [x0, y0] = [M[0][0], M[1][0]];
  let [x1, y1] = [M[0][1], M[1][1]];

  let [xmin, xmax] = d3.extent([0, x0, x1, x0 + x1]);
  let [ymin, ymax] = d3.extent([0, y0, y1, y0 + y1]);

  let xrange = xmax - xmin;
  let s = 0.4;
  xmin = xmin - s * xrange;
  xmax = xmax + s * xrange;
  let yrange = ymax - ymin;
  ymin = ymin - s * yrange;
  ymax = ymax + s * yrange;

  const w = 500;
  const h = (w * (ymax - ymin)) / (xmax - xmin);
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .attr("width", "100%")
    .style("max-width", `${w}px`)
    .style("border", "solid black 2px");

  const pad = 10;
  // let [xmin, xmax, ymin, ymax] = [-3, 3, -1, 3];
  const x_scale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  const pointToPoint = ([x, y]) => [x_scale(x), y_scale(y)];

  const configuration = svg.append("g");
  const polygon = configuration
    .append("polygon")
    .attr(
      "points",
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0]
      ].map(pointToPoint)
    )
    .attr("fill", "lightgray")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);
  const leg0 = configuration
    .append("polyline")
    .call(arrow, x_scale(0), y_scale(0), x_scale(1), y_scale(0))
    .attr("stroke", "red")
    .attr("stroke-width", 2);
  const leg1 = configuration
    .append("polyline")
    .call(arrow, x_scale(0), y_scale(0), x_scale(0), y_scale(1))
    .attr("stroke", "blue")
    .attr("stroke-width", 2);

  svg
    .append("g")
    .style("font-size", "14px")
    .attr("transform", `translate(0, ${y_scale(0)})`)
    .call(d3.axisBottom(x_scale).ticks(4));
  svg
    .append("g")
    .style("font-size", "14px")
    .attr("transform", `translate(${x_scale(0)}, 0)`)
    .call(d3.axisLeft(y_scale).ticks(4));

  svg.node().update = update;
  return svg.node();

  function update(state) {
    let x00, y00, x11, y11;
    if (state % 2 == 0) {
      x00 = 1;
      y00 = 0;
      x11 = 0;
      y11 = 1;
    } else {
      x00 = x0;
      y00 = y0;
      x11 = x1;
      y11 = y1;
    }
    leg0
      .transition()
      .duration(850)
      .attr(
        "points",
        arrowPoints(x_scale(0), y_scale(0), x_scale(x00), y_scale(y00))
      );
    leg1
      .transition()
      .duration(850)
      .attr(
        "points",
        arrowPoints(x_scale(0), y_scale(0), x_scale(x11), y_scale(y11))
      );

    polygon
      .transition()
      .duration(850)
      .attr(
        "points",
        [
          [0, 0],
          [x00, y00],
          [x00 + x11, y00 + y11],
          [x11, y11],
          [0, 0]
        ].map(pointToPoint)
      );
  }
}



// Arrows from https://observablehq.com/@oberbichler/arrow
function arrow(selection, ax, ay, bx, by, options = {}) {
  const points = arrowPoints(ax, ay, bx, by, options);

  selection.attr("points", points).attr("stroke-linejoin", "round");

  return selection;
}

function arrowPoints(ax, ay, bx, by, options = {}) {
  const dx = bx - ax;
  const dy = by - ay;

  const length = Math.sqrt(dx ** 2 + dy ** 2);

  const ux = dx / length;
  const uy = dy / length;

  const nx = -uy;
  const ny = ux;

  const h = options.arrowLength || 8;
  const w = options.arrowWidth || 4;

  const mx = bx - ux * h;
  const my = by - uy * h;

  const lx = mx - (nx * w) / 2;
  const ly = my - (ny * w) / 2;

  const rx = mx + (nx * w) / 2;
  const ry = my + (ny * w) / 2;

  return [ax, ay, mx, my, lx, ly, bx, by, rx, ry, mx, my];
}
