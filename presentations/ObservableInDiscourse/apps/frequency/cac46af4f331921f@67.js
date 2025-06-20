function _1(md){return(
md`# Frequency

A simple example illustrating an interactive graph with [Observable Plot](https://observablehq.com/plot/).`
)}

function _s(d3)
{
  let div = d3.create("div").property("value", 1);
  div.append("div").style("font-weight", "bold").text("Frequency");

  let input = div
    .append("input")
    .attr("type", "range")
    .attr("min", "-8")
    .attr("max", 8)
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


function _plot(Plot,d3,s){return(
Plot.plot({
  height: 200,
  y: { domain: [-1, 1] },
  marks: [Plot.line(d3.range(-8, 8, 0.01).map((x) => [x, Math.sin(s * x)]))]
})
)}

async function _Plot(require,FileAttachment){return(
require(await FileAttachment("plot.umd.min.js").url())
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["plot.umd.min.js", {url: new URL("./files/1bd70c8c460112986bc291de50f1c650c97a7314175b103902ab92e6cce75e47c098c7a16331bfbd45d87c0728ac64af7bd816b985548d072f93c9fd24a5cc04.js", import.meta.url), mimeType: "application/javascript", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("viewof s")).define("viewof s", ["d3"], _s);
  main.variable(observer("s")).define("s", ["Generators", "viewof s"], (G, _) => G.input(_));
  main.variable(observer("plot")).define("plot", ["Plot","d3","s"], _plot);
  main.variable(observer("Plot")).define("Plot", ["require","FileAttachment"], _Plot);
  return main;
}
