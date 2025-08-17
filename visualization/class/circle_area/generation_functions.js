import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export const h = 300;
export const w = 1.8 * h;
const r_scale = d3
  .scaleLinear()
  .domain([0, 3])
  .range([0, h]);
  

export function assemble(n) {
  const div = d3.create('div')
    .style('width', `${w}px`)
    .style('margin', '0 auto')
  const circle_container = div.append('div')
    .style('width', `${h}px`)
    .style('margin', '0 auto')
    .append(() => create_circle(n));
  const row_container = div.append('div')
    .style('width', `${w}px`)
    .style('margin', '0 auto')
    .append(() => create_row(n));
    
  return div.node()
}
  
export function create_circle(n) {
  const w = h;
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);

  const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  g.selectAll("path")
    .data(d3.range(2 * n))
    .join("path")
    .attr("d", (i) =>
      d3
        .arc()
        .innerRadius(0)
        .outerRadius(r_scale(1))
        .startAngle((Math.PI * i) / n)
        .endAngle((Math.PI * (i + 1)) / n)()
    )
    .attr("stroke", "black")
    .attr("stroke-width", 2 / n ** 0.8)
    .attr("fill", (i) => (i % 2 == 0 ? "#880000" : "#aaa"));

  return svg.node();
}

export function create_row(n) {
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);

  const [xmin, xmax] = [-2.3, 1.7];
  const [ymin, ymax] = [-0.6, 1.2];
  const x_scale = d3.scaleLinear().domain([xmin, xmax]).range([0, w]);
  const y_scale = d3.scaleLinear().domain([ymin, ymax]).range([h, 0]);

  const g = svg.append("g").attr("transform", `translate(150,-10)`);
  const g1 = g.append("g");
  g1.selectAll("path")
    .data(d3.range(n))
    .join("path")
    .attr("d", (i) =>
      d3
        .arc()
        .innerRadius(0)
        .outerRadius(r_scale(1))
        .startAngle((2 * Math.PI) / 2 - Math.PI / (2 * n))
        .endAngle((2 * Math.PI) / 2 + Math.PI / (2 * n))()
    )
    .attr("stroke", "black")
    .attr("stroke-width", 2 / n ** 0.8)
    .attr("fill", "#880000")
    .attr(
      "transform",
      (i) => `translate(${r_scale(2 * i * Math.sin(Math.PI / (2 * n)))}, 120)`
    );

  const g2 = g.append("g");
  g2.selectAll("path")
    .data(d3.range(n))
    .join("path")
    .attr("d", (i) =>
      d3
        .arc()
        .innerRadius(0)
        .outerRadius(r_scale(1))
        .startAngle(-Math.PI / (2 * n))
        .endAngle(Math.PI / (2 * n))()
    )
    .attr("stroke", "black")
    .attr("stroke-width", 2 / n ** 0.8)
    .attr("fill", "#aaa")
    .attr(
      "transform",
      (i) =>
        `translate(${r_scale(
          2 * i * Math.sin(Math.PI / (2 * n)) + Math.sin(Math.PI / (2 * n))
        )}, ${120 + r_scale(Math.cos(Math.PI / (2 * n)))})`
    );

  return svg.node();
}
