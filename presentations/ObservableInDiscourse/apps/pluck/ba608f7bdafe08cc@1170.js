function _1(md){return(
md`# Adaptive plotter

This notebook provides an adaptive function sampler that can be used in conjunction with a variety of plotting tools to produce graphs of functions. Here, for example, is how to sample a semi-complicated function over the interval [0,5]:
`
)}

function _pts(build_samples){return(
build_samples((x) => Math.sqrt(x) * Math.sin(x ** 2), 0, 5)
)}

function _3(md){return(
md`We can plot this using any tool that produces a plot from a list of points. Here's how to plot the function using [Observable's Plot](https://observablehq.com/@observablehq/plot); you can use the "Show points" toggle to see the sampled points.`
)}

function _show_points(Inputs){return(
Inputs.toggle({ label: "Show points" })
)}

function _5(Plot,pts,show_points){return(
Plot.plot({
  marks: [
    Plot.line(pts),
    Plot.ruleX([0]),
    Plot.ruleY([-2.2]),
    show_points ? Plot.dot(pts, { fill: "black", opacity: 0.5 }) : []
  ]
})
)}

function _6(md){return(
md`\`build_samples\` starts with a relatively sparse initial sampling of points and uses a recursive procedure to refine that sampling. There are \`N\` and \`max_depth\` options to control the initial number of points and maximum depth of recurison, which is handy for more complicated plots.`
)}

function _7(Plot,build_samples){return(
Plot.plot({
  marks: [
    Plot.line(
      build_samples((x) => Math.sqrt(x) * Math.sin(x ** 2), 0, 22, {
        N: 400,
        max_depth: 5
      })
    ),
    Plot.ruleX([0]),
    Plot.ruleY([-4.7])
  ]
})
)}

function _8(md){return(
md`The objective is to plot points where they're needed while not plotting too many points where they're not needed.`
)}

function _9(md,pic1){return(
md`#### A plot with ${pic1.pt_cnt} points:`
)}

function _depth(Inputs){return(
Inputs.range([0, 7], { label: "depth:", value: 3, step: 1 })
)}

function _pic1(build_samples,depth,Plot,width)
{
  let pts = build_samples((x) => (x < 0 ? Math.sqrt(1 - x ** 2) : 1), -1, 4, {
    N: 5,
    max_depth: depth
  });
  let pic = Plot.plot({
    width: width,
    height: width * 0.24,
    marks: [
      Plot.line(pts),
      Plot.dot(pts, { fill: "black" }),
      Plot.ruleX([-1]),
      Plot.ruleY([0]),
      Plot.text([[1, 0.5]], { x: (d) => d[0], y: (d) => d[1], text: "hi" })
    ]
  });
  pic.pt_cnt = pts.length;

  return pic;
}


function _12(md){return(
md`## Code`
)}

function _build_samples(Interval,test){return(
function build_samples(f, a, b, opts = {}) {
  let { N = 9, max_depth = 6 } = opts;
  let dx = (b - a) / N;
  let root_intervals = Array.from({ length: N }).map(
    (_, i) => new Interval(a + i * dx, a + (i + 1) * dx, 0)
  );
  root_intervals.forEach((I) => {
    I.fa = f(I.a);
    I.fb = f(I.b);
  });
  root_intervals.reverse();

  let stack = root_intervals;
  let cnt = 0;
  let pts = [];
  let nodeRight, nodeLeft;
  while (stack.length > 0 && cnt++ < 100000) {
    let node = stack.pop();
    if (test(f, node, opts)) {
      let midpoint = node.midpoint;
      let new_depth = node.depth + 1;
      if (new_depth <= max_depth) {
        let a_left = node.a;
        let b_left = midpoint;
        nodeLeft = new Interval(a_left, b_left, new_depth);
        nodeLeft.fa = f(a_left);
        nodeLeft.fb = f(b_left);
        node.left = nodeLeft;

        let a_right = midpoint;
        let b_right = node.b;
        nodeRight = new Interval(a_right, b_right, new_depth);
        nodeRight.fa = f(a_left);
        nodeRight.fb = f(b_left);
        node.right = nodeRight;

        stack.push(nodeRight);
        stack.push(nodeLeft);
      } else {
        pts.push(node.a);
      }
    } else {
      pts.push(node.a);
    }
  }
  pts.push(b);
  //  pts = pts.map(x => ({ x: x, y: f(x) }));
  pts = pts.map((x) => [x, f(x)]);

  if (opts.show_roots) {
    let function_roots = [];
    pts.forEach(function (o, i) {
      if (i < pts.length - 1 && Math.sign(o.y) != Math.sign(pts[i + 1].y)) {
        function_roots.push((o.x + pts[i + 1].x) / 2);
      }
    });
    pts.function_roots = function_roots;
  }
  return pts;
}
)}

function _test(){return(
function test(f, I, opts = {}) {
  let { angle_tolerance = 0.01, check_roots = false } = opts;
  let a = I.a;
  let b = I.b;
  let dx2 = (b - a) / 2;
  let m = (a + b) / 2;
  let fm = f(m);
  I.midpoint = m;
  I.f_mid = fm;
  if (check_roots && Math.sign(I.fa) != Math.sign(I.fb)) {
    return true;
  }
  let alpha = Math.atan((I.f_mid - I.fa) / dx2);
  let beta = Math.atan((I.fb - I.f_mid) / dx2);
  return Math.abs(alpha - beta) > angle_tolerance;
}
)}

function _Interval(){return(
class Interval {
  constructor(a, b, depth) {
    this.a = a;
    this.b = b;
    this.depth = depth;
  }
}
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("pts")).define("pts", ["build_samples"], _pts);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer("viewof show_points")).define("viewof show_points", ["Inputs"], _show_points);
  main.variable(observer("show_points")).define("show_points", ["Generators", "viewof show_points"], (G, _) => G.input(_));
  main.variable(observer()).define(["Plot","pts","show_points"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["Plot","build_samples"], _7);
  main.variable(observer()).define(["md"], _8);
  main.variable(observer()).define(["md","pic1"], _9);
  main.variable(observer("viewof depth")).define("viewof depth", ["Inputs"], _depth);
  main.variable(observer("depth")).define("depth", ["Generators", "viewof depth"], (G, _) => G.input(_));
  main.variable(observer("pic1")).define("pic1", ["build_samples","depth","Plot","width"], _pic1);
  main.variable(observer()).define(["md"], _12);
  main.variable(observer("build_samples")).define("build_samples", ["Interval","test"], _build_samples);
  main.variable(observer("test")).define("test", _test);
  main.variable(observer("Interval")).define("Interval", _Interval);
  return main;
}
