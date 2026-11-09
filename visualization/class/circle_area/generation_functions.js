import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const circumferenceCircle = Array.from({length: 361}, (_, i) => {
  const angle = 2 * Math.PI * i / 360;
  return [Math.cos(angle), Math.sin(angle)];
});

export function circumferencePlot(n, width, Plot) {
  const inscribedPolygon = Array.from({length: n + 1}, (_, i) => {
    const angle = 2 * Math.PI * (i % n) / n + Math.PI / 2;
    return [Math.cos(angle), Math.sin(angle)];
  });

  return Plot.plot({
    role: "img",
    ariaLabel: `Regular ${n}-sided polygon inscribed in a circle of radius 1. As the number of sides increases, its perimeter approaches the circle's circumference, 2 pi.`,
    width: Math.min(width, 440),
    aspectRatio: 1,
    x: {domain: [-1.15, 1.15], axis: null},
    y: {domain: [-1.15, 1.15], axis: null},
    marks: [
      Plot.line(circumferenceCircle, {x: d => d[0], y: d => d[1], stroke: "currentColor", strokeWidth: 2}),
      Plot.line(inscribedPolygon, {x: d => d[0], y: d => d[1], stroke: "#b33b32", strokeWidth: 2.5, fill: "#b33b32", fillOpacity: 0.12})
    ]
  });
  }

export const h = 300;
export const w = 1.8 * h;
const r_scale = d3
  .scaleLinear()
  .domain([0, 3])
  .range([0, h]);
  

export function assemble(n) {
  // The drawing helpers take the number of pairs of wedges.
  const pairs = n / 2;
  const div = d3.create('div')
    .style('width', `${w}px`)
    .style('margin', '0 auto')
  const circle_container = div.append('div')
    .style('width', `${h}px`)
    .style('margin', '0 auto')
    .append(() => create_circle(pairs));
  const row_container = div.append('div')
    .style('width', `${w}px`)
    .style('margin', '0 auto')
    .append(() => create_row(pairs));
    
  return div.node()
}
  
export function create_circle(n) {
  const w = h;
  const svg = d3
    .create("svg")
    .attr("role", "img")
    .attr("aria-label", `Circle of radius r divided into ${2 * n} equal wedges, with alternating red and gray fills.`)
    .attr("viewBox", [0, 40, w, 220])
    .style("display", "block")
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
    .attr("role", "img")
    .attr("aria-label", `The same ${2 * n} circle wedges rearranged with their tips alternating up and down. As the number of wedges increases, the shape approaches a rectangle of height r and width pi times r, as indicated by the dimension lines.`)
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

  // The scalloped arrangement approaches these dimensions as n grows.
  const radius = r_scale(1);
  const angle = Math.PI / (2 * n);
  const left = -radius * Math.sin(angle);
  const right = (2 * n - 1) * radius * Math.sin(angle);
  const top = 120 + radius * Math.cos(angle) - radius;
  const bottom = 120 + radius;
  const dimensions = g.append("g")
    .attr("stroke", "currentColor")
    .attr("stroke-width", 1.25)
    .attr("fill", "none");

  // Vertical dimension, with end ticks.
  const dimensionX = left - 22;
  dimensions.append("path").attr("d",
    `M${dimensionX},${top}V${bottom}` +
    `M${dimensionX - 5},${top}h10M${dimensionX - 5},${bottom}h10`);

  // Horizontal dimension, with end ticks.
  const dimensionY = bottom + 24;
  dimensions.append("path").attr("d",
    `M${left},${dimensionY}H${right}` +
    `M${left},${dimensionY - 5}v10M${right},${dimensionY - 5}v10`);

  const labels = g.append("g")
    .attr("fill", "currentColor")
    .attr("font-family", "serif")
    .attr("font-size", 18);
  labels.append("text")
    .attr("x", dimensionX - 10)
    .attr("y", (top + bottom) / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text("r")
    .attr("font-style", "italic");
  labels.append("text")
    .attr("x", (left + right) / 2)
    .attr("y", dimensionY + 22)
    .attr("text-anchor", "middle")
    .attr("font-style", "italic")
    .text("π r");


  // Crop unused space above the wedges while keeping the labels visible.
  const viewTop = top - 30;
  svg.attr("viewBox", [0, viewTop, w, dimensionY + 20 - viewTop])
    .style("display", "block");

  return svg.node();
}
