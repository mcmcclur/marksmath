import {
  create,
  axisBottom,
  axisLeft,
  scaleLinear,
  range,
  min,
  extent,
  line
} from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = {
  create,
  axisBottom,
  axisLeft,
  scaleLinear,
  range,
  min,
  extent,
  line
}
import {build_samples} from '/visualization/common_components/build_samples.js';


export function plot(example) {
  // let w = width < 800 ? width : 800;
  const w = 950;
  const h = 0.625 * w;
  
  const extra = 0.05*(example.b - example.a);
  const A = example.a - extra;
  const B = example.b + extra
  let pts = build_samples(example.f, A, B, {
    N: w,
  });
  let pad = 20;
  let y_values = pts.map((pt) => pt[1]);
  let [y_min, y_max] = d3.extent(y_values);
  y_min = d3.min([0,y_min]);
  let x_scale = d3
    .scaleLinear()
    .domain([A, B])
    .range([pad, w - pad]);
  let y_scale = d3
    .scaleLinear()
    .domain([y_min, y_max])
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
    
  const rect_container = svg.append('g')

  svg
    .append("path")
    .attr("d", pts_to_path(pts))
    .attr("stroke-width", 3)
    // .attr("stroke", "black")
    .attr('class', 'responsive-stroke')
    .attr("fill", "none");
  svg
    .append("g")
    .attr("transform", `translate(0, ${y_scale(0)})`)
    .call(d3.axisBottom(x_scale).tickSizeOuter(0));
  svg
    .append("g")
    .attr(
      "transform",
      `translate(${
        example.a <= 0 && 0 < example.b ? x_scale(0) : pad
      })`
    )
    .call(d3.axisLeft(y_scale).tickSizeOuter(0));
  
  svg.node().update_rects = update_rects;
  return svg.node();
  
  function update_rects(type, N) {
    rect_container.selectAll("*").remove()
    const dx = (example.b - example.a) / N;
    const xs = d3.range(example.a, example.b - dx/2, dx);
    rect_container
      .selectAll("path")
      .data(xs)
      .join('path')
      .attr("fill", "darkgray")
      .attr("stroke", "black")
      .attr("d", function(x) {
        let pts;
        if(type == "Left") {
          pts = [[x, 0], [x+dx, 0], [x+dx, example.f(x)], [x,example.f(x)]]
        }
        else if(type == "Right") {
          pts = [[x, 0], [x+dx, 0], [x+dx, example.f(x+dx)], [x,example.f(x+dx)]]
        }
        else if(type == "Midpoint") {
          pts = [[x, 0], [x+dx, 0], [x+dx, example.f(x+dx/2)], [x,example.f(x+dx/2)]]
        }
        else if(type == "Trapezoidal") {
          pts = [[x, 0], [x+dx, 0], [x+dx, example.f(x+dx)], [x,example.f(x)]]
        }
        return pts_to_path(pts)
      })
  }
}
