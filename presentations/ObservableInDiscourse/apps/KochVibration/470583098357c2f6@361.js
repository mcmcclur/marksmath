import define1 from "./e93997d5089d7165@2303.js";

function _topmatter(md){return(
md`# Koch Vibration

What would it look like if we built a drum shaped like a [Koch Snowflake](https://en.wikipedia.org/wiki/Koch_snowflake)?`
)}

function _mode(select,d3,x3d_files){return(
select({
  title: "Mode",
  options: d3.range(1, x3d_files.length + 1),
  value: 6
})
)}

async function* _membrane(x3d_files,mode,html,d3,width,x3dom)
{
  let x3d = x3d_files[mode - 1];
  let html_x3d = html`${await x3d.text()}`;
  d3.select(html_x3d).attr("width", width);
  yield html_x3d;
  x3dom.reload();
}


function _4(md){return(
md`## Comments

The vibrational modes are computed with Mathematica; the results are then exported to X3D for easy display and animation with Javascript.`
)}

function _do_it(d3,membrane,now){return(
d3
  .select(membrane)
  .select('transform')
  .attr('scale', `1 1 ${Math.sin(now / 250) / 2}`)
)}

function _x3d_files(FileAttachment){return(
[
  FileAttachment("KochScene1.x3d"),
  FileAttachment("KochScene2.x3d"),
  FileAttachment("KochScene3.x3d"),
  FileAttachment("KochScene4.x3d"),
  FileAttachment("KochScene5.x3d"),
  FileAttachment("KochScene6.x3d"),
  FileAttachment("KochScene7.x3d"),
  FileAttachment("KochScene8.x3d"),
  FileAttachment("KochScene9.x3d"),
  FileAttachment("KochScene10.x3d"),
  FileAttachment("KochScene11.x3d"),
  FileAttachment("KochScene12.x3d"),
  FileAttachment("KochScene13.x3d")
]
)}

async function _x3dom(require,FileAttachment){return(
require(await FileAttachment("x3dom.js").url()).catch(
  () => window["x3dom"]
)
)}

async function _d3(require,FileAttachment){return(
require(await FileAttachment("d3.v7.min.js").url())
)}

function _10(html){return(
html`<style>
  canvas {
    outline: none
  }
</style>`
)}

function _little(x3d_files){return(
x3d_files[5].text()
)}

function* _little_membrane(d3,width,little,x3dom)
{
  let interval_id;
  let html_x3d = d3
    .create('div')
    .style('width', `${0.25 * width}px`)
    .style('height', `${250}px`)
    .html(little);
  html_x3d
    .select('x3d')
    .attr('width', 0.25 * width)
    .attr('height', '250px')
    .select('viewpoint')
    .attr('position', '-1.61620 -2.52883 1.97864')
    .attr('orientation', '0.85616 -0.25828 -0.44753 1.06637')
    .attr('zNear', null)
    .attr('zFar', null);
  html_x3d
    .select('x3d')
    .select('transform')
    .attr('scale', '1 1 0.6');
  html_x3d
    .on('mouseenter', function() {
      let T = Date.now();
      interval_id = setInterval(function() {
        let t = (Date.now() - T) / 200;
        html_x3d.select('transform').attr('scale', `1 1 ${Math.sin(t) * 0.6}`);
      });
    })
    .on('mouseleave', () => clearInterval(interval_id));
  yield html_x3d.node();
  x3dom.reload();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["KochScene11.x3d", {url: new URL("./files/04179996b36afb3033639fe1e7c66f5a10afcd19322aac95197c2cc9cae75ed79296203294e4a96cb71eb3c8c5b10dfa1d796e88851aeb251d4d54827cf5d489.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene10.x3d", {url: new URL("./files/1e3c5ca4aae4932c4e957556723a5c6ae4355ffc96ae15dd7d7a70b57095094b565e27d23578b6d455fe78b905e0b784d6298d858d78af9b60d99b65891dac37.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene9.x3d", {url: new URL("./files/4791f54b7a04d9582be87debaa8fc68114faaf3c0832750be6eec79e87f5d2c121bf81b6c450bdaef39385d195ca03a070ebb287e1765122b43b503a92dda962.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene8.x3d", {url: new URL("./files/9efbfda26bf64e27bbfa214918be0757fbeadabe8fa7eb7de511367612f625d6cbf3855a39b77299a4fc706b115e168dc3f10114ce0b07261beb1433f7821157.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene7.x3d", {url: new URL("./files/0156755515d5d3154c5c7c05bae711ad509f2a50c70f9bd47b1f267899eb8b2cd353965d9d4e97d9b22874741657ebeb04e8effdd41af377063f8c259c13fac9.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene6.x3d", {url: new URL("./files/f5e602a978d668d42de16a6f78bbb0b935c731a652ffe21536b39841646a24c9195cc889c360f9bc82d1a14c2300a68b3af77c267bdb4b52ed8db4ce055adabd.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene4.x3d", {url: new URL("./files/2d3f65014a72e2a0040ec0f1efb14a7b392e5cbe2de0196e8882df326fa1bd8b7136e2c154126e6fb3150f81a2e9f3bed0ace6ed8acf799304c18479ae23f6ee.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene3.x3d", {url: new URL("./files/3d77a6e228ff2cb39faf4af2e19bcbfac591cb49740306865e7d5f42409306a9e0ea564c5611a43dca93f1c0a1076b95bbf7e03aa07d3dcab0353b782be2d606.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene2.x3d", {url: new URL("./files/7bc675c5bb192824d65efe9ba5bc50ffd31b4f52fb2993d9cf23d969860a0b56a9975dcf64d5b76acfec42949ca3e565e1031454b5e239105df4fcbd5b094767.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene1.x3d", {url: new URL("./files/ceb53d91e74241c313ad7067bb0ac0fdfafe60e4a703c47ea5afcfd6c8a94dd5ca08a7ee9f33801344c7dbb96f53fd06a8ed5c06acb9e5aefc8b22c5ee742acd.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene12.x3d", {url: new URL("./files/be646df70b07cf083384fab899a42eb5fdddf1b0e480306951ad042a0cf469d1c0701dca974aa36aeaa8f3a592c4c73368bdba9433449ac23804125625a2f1bf.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene5.x3d", {url: new URL("./files/c8cd0a1c95e986249a5f3708be0812b2e6126edb114c2ba3e2b1014343e1ce7e0caaf2fb038cf65db5c80c247f135d828029f00713962679ccea54db83fb3b3a.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["KochScene13.x3d", {url: new URL("./files/d110972364fd0c35701e7961aaeef77a1b23c5c7e58c5c9783caa90f38ad77f88d37f39403cad2aee5488c37d43eb8d67b999bd587f113d65e534b8fd484f284.x3d", import.meta.url), mimeType: "model/x3d+xml", toString}],
    ["x3dom.js", {url: new URL("./files/6d31e2ebd7127be0752114126438030e29a99b4c01753bc64d0080dbba1f3372b2f278aaf6aafde06968e3ade67f1b18ea7328dc89fec60bf3d06262bd2059f8.js", import.meta.url), mimeType: "application/javascript", toString}],
    ["d3.v7.min.js", {url: new URL("./files/bd0c4465626a773fd0d4256bcc4f7462affd5ca0d4d7a7f0bb6c8e76df275666545847da0ea9b22be0daaf243a7bb00e3a725bb1bc982f90ba2018e998781474.js", import.meta.url), mimeType: "application/javascript", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("topmatter")).define("topmatter", ["md"], _topmatter);
  main.variable(observer("viewof mode")).define("viewof mode", ["select","d3","x3d_files"], _mode);
  main.variable(observer("mode")).define("mode", ["Generators", "viewof mode"], (G, _) => G.input(_));
  main.variable(observer("membrane")).define("membrane", ["x3d_files","mode","html","d3","width","x3dom"], _membrane);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer("do_it")).define("do_it", ["d3","membrane","now"], _do_it);
  main.variable(observer("x3d_files")).define("x3d_files", ["FileAttachment"], _x3d_files);
  const child1 = runtime.module(define1);
  main.import("select", child1);
  main.variable(observer("x3dom")).define("x3dom", ["require","FileAttachment"], _x3dom);
  main.variable(observer("d3")).define("d3", ["require","FileAttachment"], _d3);
  main.variable(observer()).define(["html"], _10);
  main.variable(observer("little")).define("little", ["x3d_files"], _little);
  main.variable(observer("little_membrane")).define("little_membrane", ["d3","width","little","x3dom"], _little_membrane);
  return main;
}
