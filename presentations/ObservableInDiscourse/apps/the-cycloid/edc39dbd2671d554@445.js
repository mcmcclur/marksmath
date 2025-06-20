import define1 from "./ecfd1c502129818a@13.js";

function _1(md){return(
md`# The cycloid`
)}

function _description(md,tex){return(
md`A [cycloid](https://en.wikipedia.org/wiki/Cycloid) is traced out by a point on a wheel as it rolls along the ground. This interactive illustrates how such a curve is traced out. By fiddling with the sliders, you can change how far the wheel has rolled or how far the point is from the center of the wheel to generate slightly different curves. The parametric formula for the path is 
${tex.block`
\begin{aligned}
  x(t) &= t - r\sin(t) \\
  y(t) &= 1-r\cos(t).
\end{aligned}
`}`
)}

function _cycloid(make_cycloid,r,t){return(
make_cycloid(r, t)
)}

function _t(d3)
{
  let div = d3.create("div").property("value", 2 * Math.PI);
  div.append("div").style("font-weight", "bold").text("Distance rolled");

  let input = div
    .append("input")
    .attr("type", "range")
    .attr("min", "0")
    .attr("max", 6 * Math.PI)
    .attr("step", Math.PI / 100)
    .property("value", 2 * Math.PI);
  // let inputNode = input.node();
  input.on("input", function () {
    div.property("value", +input.property("value"));
    div.node().dispatchEvent(new CustomEvent("input"));
  });
  // input.on("input", () => inputNode.dispatchEvent(new CustomEvent("input")));

  return div.node();
}


function _r(d3)
{
  let div = d3.create("div").property("value", 1);
  div.append("div").style("font-weight", "bold").text("Radius");

  let input = div
    .append("input")
    .attr("type", "range")
    .attr("min", "0")
    .attr("max", 1.5)
    .attr("step", 0.01)
    .property("value", 1);
  // let inputNode = input.node();
  input.on("input", function () {
    div.property("value", +input.property("value"));
    div.node().dispatchEvent(new CustomEvent("input"));
  });
  // input.on("input", () => inputNode.dispatchEvent(new CustomEvent("input")));

  return div.node();
}


function _make_cycloid(width,d3,p,pp){return(
function make_cycloid(r, t) {
  const xmin = -1.6;
  const xmax = 20.4;
  const ymin = -1.6;
  const ymax = 2.6;
  const height = (width * (ymax - ymin)) / (xmax - xmin);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", `${width}px`);

  const xScale = d3.scaleLinear().domain([xmin, xmax]).range([0, width]);
  const yScale = d3.scaleLinear().domain([ymin, ymax]).range([height, 0]);
  const rScale = d3
    .scaleLinear()
    .domain([0, xmax - xmin])
    .range([0, width]);
  const pts_to_path = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    });

  let point = p(r, t);
  svg
    .append("path")
    .attr(
      "d",
      pts_to_path([
        [xmin, 0],
        [xmax, 0]
      ])
    )
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("fill", "none");

  svg
    .append("circle")
    .attr("cx", xScale(t))
    .attr("cy", yScale(1))
    .attr("r", rScale(1))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);
  svg
    .append("path")
    .attr("d", pts_to_path(pp(r, t)))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "none");
  svg
    .append("path")
    .attr("d", pts_to_path([[t, 1], point]))
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("fill", "none");
  svg
    .append("circle")
    .attr("cx", xScale(point[0]))
    .attr("cy", yScale(point[1]))
    .attr("r", rScale(0.07))
    .attr("fill", "black")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  // const tex_data = d3.range(7).map(k => ({
  //   x: k * Math.PI,
  //   tex: k == 0 ? '0' : k == 1 ? '\\pi' : `${k}\\pi`
  // }));

  // svg
  //   .append("g")
  //   .selectAll("path")
  //   .data(tex_data)
  //   .join("path")
  //   .attr('d', d => pts_to_path([[d.x, 0], [d.x, -0.1]]))
  //   .attr("stroke", "black")
  //   .attr("stroke-width", 1)
  //   .attr("fill", "none");

  // svg
  //   .append("g")
  //   .selectAll("foreignObject")
  //   .data(tex_data)
  //   .join("foreignObject")
  //   .attr('x', d => (d.x > 1 ? xScale(d.x - 0.2) : xScale(d.x - 0.1)))
  //   .attr("y", yScale(-0.1))
  //   .attr("width", 40)
  //   .attr("height", 20)
  //   .append(d => tex`${d.tex}`);

  return svg.node();
}
)}

function _pp(d3,p){return(
function pp(r, t) {
  let ts = d3.range(0, t, 0.1);
  ts.push(t);
  return ts.map(tt => p(r, tt));
}
)}

function _p(){return(
function p(r, t) {
  return [t - r * Math.sin(t), 1 - r * Math.cos(t)];
}
)}

function _10(html){return(
html`<style>
input[type='range'] {
	padding: 10px;
}
output[name='output'] {
  display: none;
}
</style>`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("description")).define("description", ["md","tex"], _description);
  main.variable(observer("cycloid")).define("cycloid", ["make_cycloid","r","t"], _cycloid);
  main.variable(observer("viewof t")).define("viewof t", ["d3"], _t);
  main.variable(observer("t")).define("t", ["Generators", "viewof t"], (G, _) => G.input(_));
  main.variable(observer("viewof r")).define("viewof r", ["d3"], _r);
  main.variable(observer("r")).define("r", ["Generators", "viewof r"], (G, _) => G.input(_));
  main.variable(observer("make_cycloid")).define("make_cycloid", ["width","d3","p","pp"], _make_cycloid);
  main.variable(observer("pp")).define("pp", ["d3","p"], _pp);
  main.variable(observer("p")).define("p", _p);
  const child1 = runtime.module(define1);
  main.import("d3", child1);
  main.variable(observer()).define(["html"], _10);
  return main;
}
