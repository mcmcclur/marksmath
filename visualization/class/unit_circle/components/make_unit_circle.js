import {import_mathjax} from './import_mathjax.js';
import {
  create, scaleLinear, line
} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const d3 = {
  create, scaleLinear, line 
}
const MathJax = import_mathjax();

export function make_unit_circle(angle_data, more_angles) {
  const svg_width = 800;
  const s0 = svg_width/800
  let s = 1.2 * s0;
  let svg_height = svg_width;

  let padding = 80;
  let svg = d3
    .create("svg")
    .attr('viewBox', [0,0,svg_width, svg_height])
    .attr("max-width", svg_width)
    // .attr("height", svg_height);

  let xmin = -1.2;
  let xmax = 1.2;
  let ymin = -1.2;
  let ymax = 1.2;
  let xScale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([padding, svg_width - padding]);
  let yScale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([svg_height - padding, padding]);
  let rScale = d3
    .scaleLinear()
    .domain([0, xmax - xmin])
    .range([0, svg_width - 2 * padding]);
  let pts_to_path = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    });

  let angles_to_show;
  if (more_angles) {
    angles_to_show = angle_data;
  } else {
    angles_to_show = angle_data.slice(0, 16);
  }
  svg
    .append("circle")
    .attr("cx", xScale(0))
    .attr("cy", yScale(0))
    .attr("r", rScale(1))
    .attr("fill", "none")
    // .attr("stroke", "black")
    .classed('responsive-stroke', true)
    .attr("stroke-width", 2);
  svg
    .append("g")
    .selectAll("path")
    .data(angles_to_show)
    .enter()
    .append("path")
    .attr("d", function (d) {
      return pts_to_path([[0, 0], d.pt]);
    })
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("fill", "none")
    .attr("opacity", 0.4);

  svg
    .append("g")
    .selectAll("circle")
    .data(angles_to_show)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.pt[0]);
    })
    .attr("cy", function (d) {
      return yScale(d.pt[1]);
    })
    .attr("r", (d, i) => (i < 16 ? rScale(0.03) : rScale(0.02)))
    .attr("fill", function (d) {
      return d.color;
    })
    // .attr("stroke", "black")
    .classed('responsive-stroke', true)
    .attr("stroke-width", 2 * s0)


    // An attempt to make this look semi-decent on a phone
    // .on("mouseenter", show_info)
    .on("pointerenter", function (evt, d) {
      svg.selectAll(".temp").remove();
      show_info(evt, d);
    })
    .on("mouseleave", function () {
      svg.selectAll(".temp").remove();
    });
    
  function show_info(evt, d) {
    let pt_tex_snippet = MathJax.tex2svg(d.pt_tex).querySelector("svg");
    let g1 = svg
      .append("g")
      .style("pointer-events", "none")
      .attr("class", "temp mathjax-container")
      .attr(
        "transform",
        `translate(${1 * xScale(d.pt[0]) - (s * d.ptWidth) / 2} ${
          1 * yScale(d.pt[1]) - (s * d.ptHeight) / 2
        }) scale(${s})`
      );
    g1.append("rect")
      .attr("width", 1.1 * d.ptWidth)
      .attr("height", 1.1 * d.ptHeight)
      .attr("opacity", 0.9);
    g1.append(() => pt_tex_snippet);

    let th_tex_snippet = MathJax.tex2svg(d.th_tex).querySelector("svg");
    let g2 = svg
      .append("g")
      .style("pointer-events", "none")
      .attr("class", "temp mathjax-container")
      .attr(
        "transform",
        `translate(${xScale(d.pt[0] / 2) - (s * d.thWidth) / 2} ${
          yScale(d.pt[1] / 2) - (s * d.thHeight) / 2
        }) scale(${s})`
      );
    g2.append("rect")
      .attr("width", 1.1*d.thWidth)
      .attr("height", 1.1*d.thHeight)
      .attr("opacity", 0.9);
    g2.append(() => th_tex_snippet); 
  }

  return svg.node();
}
