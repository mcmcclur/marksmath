import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {import_mathjax} from './import_mathjax.js';
const MathJax = import_mathjax();



export function make_one_step_transition_pic(M) {
  let [x0, y0] = [M[0][0], M[1][0]];
  let [x1, y1] = [M[0][1], M[1][1]];

  let [xmin, xmax] = d3.extent([0, x0, x1, x0 + x1, 1]);
  let [ymin, ymax] = d3.extent([0, y0, y1, y0 + y1, 1]);

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

export function make_rotated_square(theta) {
  const [xmin,xmax, ymin, ymax] = [-2,2,-2,2];
  const w = 500;
  const h = w;
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .attr("width", "100%")
    .style("max-width", `${w}px`)
    .style("border", "solid black 2px");

  const pad = 10;
  const x_scale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  const r_scale = d3
    .scaleLinear()
    .domain([0, xmax-xmin])
    .range([0, w]);  
  const pointToPoint = ([x, y]) => [x_scale(x), y_scale(y)];

  const configuration = svg.append("g");
  const polygon = configuration
    .append("polygon")
    .attr(
      "points",
      [
        [0, 0],
        [Math.cos(theta), Math.sin(theta)],
        [Math.cos(theta)-Math.sin(theta), Math.cos(theta)+Math.sin(theta)],
        [-Math.sin(theta), Math.cos(theta)],
        [0, 0]
      ].map(pointToPoint)
    )
    .attr("fill", "lightgray")
    .attr("stroke", "black")
    .attr("stroke-width", 0.5);
  const leg0 = configuration
    .append("polyline")
    .call(arrow, x_scale(0), y_scale(0), x_scale(Math.cos(theta)), y_scale(Math.sin(theta)))
    .attr("stroke", "red")
    .attr("stroke-width", 2);
  const leg1 = configuration
    .append("polyline")
    .call(arrow, x_scale(0), y_scale(0), x_scale(-Math.sin(theta)), y_scale(Math.cos(theta)))
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
  svg.append('circle')
    .attr('cx', x_scale(0))
    .attr('cy', y_scale(0))
    .attr('r', r_scale(0.05))
    .attr('fill', 'black')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);
  return svg.node();
}

export function make_reflection_step_pic() {
  const [xmin, xmax, ymin, ymax] = [-0.8, 1.8, -1, 1.1];
  const w = 640;
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
    .attr("fill", "gray")
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

  const t = Math.atan(1/2);
  const R = -2.2;
  configuration.append('path')
    .attr('d', pts_to_path([[-R*Math.cos(t), -R*Math.sin(t)], [R*Math.cos(t), R*Math.sin(t)]]))
    .attr('stroke', 'black');

  const r = x_scale(0.33) - x_scale(0);
  configuration
    .append("path")
    .attr("d", d3.arc()
      .innerRadius(r)
      .outerRadius(r)
      .startAngle(Math.PI/2 - t)
      .endAngle(Math.PI / 2))
    .attr("transform", `translate(${x_scale(0)},${y_scale(0)})`)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)

  const cx = x_scale(0);
  const cy = y_scale(0);
  const T = t*180/Math.PI;

  configuration
    .append("g")
    .attr("transform", `translate(${x_scale(0.35)}, ${y_scale(0.12)})`)
    .append(() =>
      MathJax.tex2svg(String.raw`\large\theta`).querySelector("svg")
    );

  svg.node().take_step = take_step;
  return svg.node();

  function take_step(step) {
    if(step % 4 == 0) {
      configuration.attr('transform', null)
    }
    else if(step % 4 == 1) {
      configuration
        // .attr('transform', `rotate(0, ${cx}, ${cx})`)
        .transition()
        .duration(800)
        .tween('rotateAroundOrigin', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(0, T);
            return function (u) {
              sel.attr('transform', `rotate(${interp(u)}, ${cx}, ${cy})`);
            };
          })
        //.attr('transform', `rotate(${t*180/Math.PI}, ${x_scale(0)}, ${y_scale(0)})`)
    } else if(step % 4 == 2) {
      configuration
        // .attr('transform', `translate(0,${cy}) scale(1,1}) translate(0,${-cy}) rotate(${T}, ${cy}, ${cy})`)
        .transition()
        .duration(800)
        .tween('rotateAroundOrigin', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(1,-1);
            return function (u) {
              sel.attr('transform', `translate(0,${cy}) scale(1,${interp(u)}) translate(0,${-cy}) rotate(${T}, ${cx}, ${cy})`);
            };
          })
    } else if(step % 4 == 3) {
      configuration
        // .attr('transform', `translate(0,${cy}) scale(1,-1) translate(0,${-cy}) rotate(${T}, ${cx}, ${cy})`)
        .transition()
        .duration(800)
        // .attr('transform', `translate(0,${cy}) `)
        .tween('rotateAroundOrigin', function () {
            const sel = d3.select(this);
            const interp = d3.interpolateNumber(0,-T);
            return function (u) {
              sel.attr('transform', `rotate(${interp(u)}, ${cx}, ${cy}) translate(0,${cy}) scale(1,-1) translate(0,${-cy}) rotate(${T}, ${cx}, ${cy})`);
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
