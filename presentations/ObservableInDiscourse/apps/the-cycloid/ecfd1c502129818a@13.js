function _1(md){return(
md`# Simple local JS`
)}

function _div(d3)
{
  let div = d3.create('div').text('Hello from your local D3!');
  return div.node();
}


async function _d3(require,FileAttachment){return(
require(await FileAttachment("d3.v5.min.js").url())
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["d3.v5.min.js", {url: new URL("./files/ce4450cc7608664358fdb193fb52fb7d447eb9f7e24ed88a7c12bf9721c2cbda96d042289188bce1cdf48a066a6520b4cdde04c1ba5ef6e25d711d0122c0bbe3.js", import.meta.url), mimeType: "application/javascript", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("div")).define("div", ["d3"], _div);
  main.variable(observer("d3")).define("d3", ["require","FileAttachment"], _d3);
  return main;
}
