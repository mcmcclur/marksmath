import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function reflect_rotate_reflect() {
  const [xmin, xmax, ymin, ymax] = [-1.2, 1.2, -1.2, 1.2];
  const w = 500;
  const h = w*(ymax-ymin)/(xmax-xmin);
  const pad = 10;
  const x_scale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  const pointToPoint = ([x, y]) => [x_scale(x), y_scale(y)];
  const pts_to_path = d3
    .line()
    .x(function (d) {
      return x_scale(d[0]);
    })
    .y(function (d) {
      return y_scale(d[1]);
    });

  const svg = d3.create('svg')
    .attr('viewBox', [0,0,w,h])
    .style('max-width', `${w}px`)
    .style('border', 'solid 1px black');
  svg
    .append("g")
    .style("font-size", "14px")
    .attr("transform", `translate(0, ${y_scale(0)})`)
    .call(d3.axisBottom(x_scale).ticks(5).tickSizeOuter(0));
  svg
    .append("g")
    .style("font-size", "14px")
    .attr("transform", `translate(${x_scale(0)}, 0)`)
    .call(d3.axisLeft(y_scale).ticks(5).tickSizeOuter(0));

  const configuration = svg.append("g")
  configuration
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
    .attr("stroke", "currentColor")
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

//   const t = Math.atan(1/2);
//   const R = -2.2;
//   configuration.append('path')
//     .attr('d', pts_to_path([[-R*Math.cos(t), -R*Math.sin(t)], [R*Math.cos(t), R*Math.sin(t)]]))
//     .attr('stroke', 'black');

//   const r = x_scale(0.33) - x_scale(0);
//   configuration
//     .append("path")
//     .attr("d", d3.arc()
//       .innerRadius(r)
//       .outerRadius(r)
//       .startAngle(Math.PI/2 - t)
//       .endAngle(Math.PI / 2))
//     .attr("transform", `translate(${x_scale(0)},${y_scale(0)})`)
//     .attr("fill", "none")
//     .attr("stroke", "black")
//     .attr("stroke-width", 2)

//   const cx = x_scale(0);
//   const cy = y_scale(0);
//   const T = t*180/Math.PI;

//   configuration
//     .append("g")
//     .attr("transform", `translate(${x_scale(0.35)}, ${y_scale(0.12)})`)
//     .append(() =>
//       MathJax.tex2svg(String.raw`\large\theta`).querySelector("svg")
//     );

  const x0 = x_scale(0);
  const y0 = y_scale(0);
  svg.node().take_step = take_step;
  return svg.node();

  function take_step(step) {
    if(step % 4 == 0) {
      configuration.attr('transform', null)
    }
    else if(step % 4 == 1) {
      configuration
        .transition()
        .duration(800)
        .tween('transformation', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(1,-1);
            return function (u) {
              sel.attr('transform', `translate(0,${y0}) scale(1,${interp(u)}) translate(0,${-y0})`);
            };
          })
    } 
    else if(step % 4 == 2) {
      configuration
        .transition()
        .duration(800)
        .tween('transformation', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(0,-90);
            return function (u) {
              sel.attr('transform', `rotate(${interp(u)}, ${x0}, ${y0}) translate(0,${y0}) scale(1,-1) translate(0,${-y0})`);
            };
          })
    }    
    else if(step % 4 == 3) {
      configuration
        .transition()
        .duration(800)
        .tween('transformation', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(1,-1);
            return function (u) {
              sel.attr('transform', `translate(0,${y0}) scale(1,${interp(u)}) translate(0,${-y0}) rotate(-90, ${x0}, ${y0}) translate(0,${y0}) scale(1,-1) translate(0,${-y0})`);
            };
          })
    } 
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
