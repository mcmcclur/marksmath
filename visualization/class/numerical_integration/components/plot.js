import {
  create,
  axisBottom,
  axisLeft,
  min,
  max,
  group,
  scaleLinear,
  line
} from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = {
  create,
  axisBottom,
  axisLeft,
  min,
  max,
  group,
  scaleLinear,
  line
}
import {build_samples} from '/visualization/common_components/build_samples.js';



export function plot(parsing_info) {
  if (
    parsing_info.f_ready &&
    parsing_info.f_success &&
    parsing_info.a_success &&
    parsing_info.a != undefined &&
    parsing_info.b_success &&
    parsing_info.b != undefined
  ) {
    // let w = width < 800 ? width : 800;
    let w = 850;
    let h = 0.625 * w;
    let pts = build_samples(parsing_info.f, parsing_info.a, parsing_info.b, {
      N: 4 * w,
      check_roots: true
    });
    let grouped_pts = d3.group(pts, (pt) => Math.sign(pt[1]));
    let pad = 30;
    let y_values = pts.map((pt) => pt[1]);
    let ymin = d3.min([0, d3.min(y_values)]);
    let ymax = d3.max([0, d3.max(y_values)]);
    let x_scale = d3
      .scaleLinear()
      .domain([parsing_info.a, parsing_info.b])
      .range([pad, w - pad]);
    let y_scale = d3
      .scaleLinear()
      .domain([ymin, ymax])
      .range([h - pad, pad]);
    let pts_to_path = d3
      .line()
      .x((d) => x_scale(d[0]))
      .y((d) => y_scale(d[1]));

    let svg = d3
      .create("svg")
      .style("max-width", `${w}px`)
      .attr('viewBox', [0,0,w,h])
      // .style("height", `${h}px`)

    let pos_pts = grouped_pts.get(1);
    if (pos_pts) {
      pos_pts = [[pos_pts[0][0], 0]] // [{ x: pos_pts[0].x, y: 0 }]
        .concat(pos_pts)
        .concat([[pos_pts.slice(-1)[0][0], 0]]); // ([{ x: pos_pts.slice(-1)[0].x, y: 0 }]);
      svg
        .append("path")
        .attr("d", pts_to_path(pos_pts))
        .attr("stroke", "none")
        .attr("fill", "lightgreen");
    }
    let neg_pts = grouped_pts.get(-1);
    if (neg_pts) {
      neg_pts = [[neg_pts[0][0], 0]]
        .concat(neg_pts)
        .concat([[neg_pts.slice(-1)[0][0], 0]]);
      svg
        .append("path")
        .attr("d", pts_to_path(neg_pts))
        .attr("stroke", "none")
        .attr("fill", "red");
    }
    svg
      .append("path")
      .attr("d", pts_to_path(pts))
      .attr("stroke-width", 2)
      // .attr("stroke", "black")
      .attr('class', 'responsive-stroke')
      .attr("fill", "none");
    svg
      .append("g")
      .attr("transform", `translate(0, ${y_scale(0)})`)
      .call(d3.axisBottom(x_scale));
    svg
      .append("g")
      .attr(
        "transform",
        `translate(${
          parsing_info.a <= 0 && 0 < parsing_info.b ? x_scale(0) : pad
        })`
      )
      .call(d3.axisLeft(y_scale));
    //return grouped_pts.get(1);
    return svg.node();
  }
}
