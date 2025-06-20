import define1 from "./ba608f7bdafe08cc@1170.js";

function _title(md){return(
md`# Pluck`
)}

function _top_matter(md){return(
md`Here's an interactive graphic that's not as eye catching as some but, I hope, illustrates the way that a little mathematics and Observable can be used to model reality. The line segment below is, meant to be something like a taut string; you can use your mouse or touchpad to pluck it so that it vibrates. The string is damped so it should stop after a few seconds.`
)}

function _guitar_string(make_guitar_string){return(
make_guitar_string()
)}

function _comments(md,tex){return(
md`## Comments

This demo illustrates one of the most basic applications of partial differential equations. Specifically, the animation shows solutions of the damped wave equation:
${tex.block`u_{tt} + d \, u_t = c^2u_{xx},`} 
with ${tex`c=0.7`} and ${tex`d=0.35`}.
The ends of the wire are clamped, so that the solutions are subject to the boundary conditions
${tex.block`u(0,t) = 0 \text{ and } u(1,t) = 0.`} 
For a second order PDE like this, we also need conditions on the initial position of the string and the initial velocity, which we take to be
${tex.block`u(x,0) = f(x) \text{ and } u_t(x,0) = 0.`}
This means that the string is held in an initial position described by ${tex`f(x)`} and then released from rest. When you "pluck" the string, you are effectively specifying the initial position to be a function ${tex`f`} of the form
${tex.block`f(x) = 
A\begin{cases}
  x/x_0 & \text{if } \: 0 \leq x \leq x_0 \\
  (x-1)/(x_0-1) & \text{if } \: x_0 < x \leq 1.
\end{cases}`}

The PDE with these boundary and initial conditions can be solved using separation of variables and Fourier series to yield the lovely expression
${tex.block`u_{A,x_0}(x,t) = -2 A e^{-d\,t/2} \underset{n=1}{\overset{\infty }{\sum }}\frac{\sin (\pi  n x) \sin (\pi  n x_0)
   \left(\sin \left(\frac{t}{2} \sqrt{4 \pi ^2 c^2 n^2-d^2}\right)+\sqrt{4 \pi ^2 c^2 n^2-d^2} \cos
   \left(\frac{t}{2} \sqrt{4 \pi ^2 c^2 n^2-d^2}\right)\right)}{\pi ^2 n^2 \, x_0 (x_0-1) \sqrt{4 \pi ^2 c^2 n^2-d^2}}.`}
This is exactly the solution implemented in the code.
`
)}

function _5(md){return(
md`## Code`
)}

function _make_guitar_string(width,d3,build_samples,u){return(
function make_guitar_string() {
  let xmin = 0;
  let xmax = 1;
  // let ymin = -0.309017;
  // let ymax = 0.309017;
  let ymin = -1 / 2;
  let ymax = 1 / 2;
  let w = width < 800 ? width : 800;
  let h = w * 0.4;
  let pad = 15;

  let xScale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  let yScale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  let pts_to_path = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    });

  let svg = d3
    .create("svg")
    .attr("width", w)
    .attr("height", h)
    .style("background-color", "white");

  svg
    .append("path")
    .attr("class", "string")
    .attr(
      "d",
      pts_to_path([
        [0, 0],
        [1, 0]
      ])
    )
    .style("stroke", "black")
    .style("stroke-width", 0.8)
    .style("fill", "none");

  svg
    .append("circle")
    .attr("class", "pick")
    .attr("r", 5)
    .attr("cx", 0)
    .attr("cy", yScale(0))
    .attr("fill", "lightgray")
    .attr("stroke", "black")
    .attr("opacity", 0);
  svg
    .append("circle")
    .attr("class", "pin")
    .attr("r", 5)
    .attr("cx", xScale(0))
    .attr("cy", yScale(0))
    .attr("fill", "red")
    .attr("stroke", "black");
  svg
    .append("circle")
    .attr("class", "pin")
    .attr("r", 5)
    .attr("cx", xScale(1))
    .attr("cy", yScale(0))
    .attr("fill", "red")
    .attr("stroke", "black");

  let interval_id = 0;
  let state = "stopped";
  svg
    .on("touchmove", (e) => e.preventDefault()) // prevent scrolling
    .on("pointermove", function (evt) {
      if (state == "stopped") {
        if (
          Math.abs(yScale.invert(evt.layerY)) <= 0.02 &&
          0 < xScale.invert(evt.layerX) &&
          xScale.invert(evt.layerX) < 1
        ) {
          svg.select("circle.pick").attr("cx", evt.layerX).attr("opacity", 1);
        } else if (
          Math.abs(yScale.invert(evt.layerY)) > 0.02 ||
          xScale.invert(evt.layerX) < 0 ||
          xScale.invert(evt.layerX) > 1
        ) {
          svg.select("circle.pick").attr("opacity", 0);
        }
      } else if (state == "pluck") {
        svg
          .select("circle.pick")
          .attr("cx", evt.layerX)
          .attr("cy", evt.layerY)
          .attr("opacity", 1);
        svg.select("path.string").attr(
          "d",
          pts_to_path([
            [0, 0],
            [xScale.invert(evt.layerX), yScale.invert(evt.layerY)],
            [1, 0]
          ])
        );
      }
    })
    .on("pointerdown", function (evt) {
      if (state == "stopped" && Math.abs(yScale.invert(evt.layerY)) < 0.02) {
        state = "pluck";
      }
    })
    .on("pointerup", function (evt) {
      if (state == "pluck") {
        state = "vibrating";
        svg.select("circle.pick").attr("cy", yScale(0)).attr("opacity", 0);

        clearInterval(interval_id);
        let i = 0;
        interval_id = setInterval(function () {
          let pts = build_samples(
            (x) =>
              u(
                yScale.invert(evt.layerY),
                xScale.invert(evt.layerX),
                x,
                i++ / 3000
              ),
            0,
            1
          );
          svg.select("path.string").attr("d", pts_to_path(pts));

          // Trails don't look as nice as I might have hoped
          // if (i % 10 == 1) {
          //   svg
          //     .append("path")
          //     .attr("class", "trail")
          //     .attr("d", pts_to_path(pts))
          //     .style("stroke", "black")
          //     .style("stroke-width", 0.8)
          //     .style("fill", "none")
          //     .style("opacity", 0.2);
          // }
          if (i > 120000) {
            clearInterval(interval_id);
            state = "stopped";
          }
        });
      }
    });

  return svg.node();
}
)}

function _u(d3,term){return(
function u(A, x0, x, t) {
  return d3.sum(d3.range(32).map(n => term(A, x0, x, t, n)));
}
)}

function _term(pi2){return(
function term(A, x0, x, t, n) {
  let c = 0.8;
  let d = 0.3;
  let n2 = n ** 2;
  let sqrt4p2n2_1 = Math.sqrt(4 * pi2 * c ** 2 * n2 - d ** 2);
  return (
    (-2 *
      A *
      Math.exp((-d * t) / 2) *
      (sqrt4p2n2_1 * Math.cos((sqrt4p2n2_1 * t) / 2) +
        d * Math.sin((sqrt4p2n2_1 * t) / 2)) *
      Math.sin(n * Math.PI * x) *
      Math.sin(n * Math.PI * x0)) /
    (n2 * pi2 * sqrt4p2n2_1 * (x0 - 1) * x0)
  );
}
)}

function _pi2(){return(
Math.PI ** 2
)}

async function _d3(require,FileAttachment){return(
require(await FileAttachment("d3.v7.min.js").url())
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["d3.v7.min.js", {url: new URL("./files/bd0c4465626a773fd0d4256bcc4f7462affd5ca0d4d7a7f0bb6c8e76df275666545847da0ea9b22be0daaf243a7bb00e3a725bb1bc982f90ba2018e998781474.js", import.meta.url), mimeType: "application/javascript", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("title")).define("title", ["md"], _title);
  main.variable(observer("top_matter")).define("top_matter", ["md"], _top_matter);
  main.variable(observer("guitar_string")).define("guitar_string", ["make_guitar_string"], _guitar_string);
  main.variable(observer("comments")).define("comments", ["md","tex"], _comments);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer("make_guitar_string")).define("make_guitar_string", ["width","d3","build_samples","u"], _make_guitar_string);
  main.variable(observer("u")).define("u", ["d3","term"], _u);
  main.variable(observer("term")).define("term", ["pi2"], _term);
  main.variable(observer("pi2")).define("pi2", _pi2);
  main.variable(observer("d3")).define("d3", ["require","FileAttachment"], _d3);
  const child1 = runtime.module(define1);
  main.import("build_samples", child1);
  return main;
}
