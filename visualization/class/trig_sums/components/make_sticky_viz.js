import {import_mathjax} from './import_mathjax.js';
// import {
//   select, 
//   create
// } from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
// const d3 = {
//   create,
//   select 
// }
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
const MathJax = import_mathjax();


export function make_sticky_viz() {
  const diagram = make_diagram();
  return diagram;
}

// function update({index, direction}) {
//   console.log([a,b,c])
// }

function make_diagram() {
  let deg = Math.PI / 180;
  let alpha = 25 * deg;
  let beta = 35 * deg;
  let sa = Math.sin(alpha);
  let sb = Math.sin(beta);
  let sab = Math.sin(alpha + beta);
  let ca = Math.cos(alpha);
  let cb = Math.cos(beta);
  let cab = Math.cos(alpha + beta);

  let xmax = ca * cb;
  let ymax = sab;
  let pad = 0.05;
  let d = 0.05 * xmax;
  
  // let w,h;

  // let w = 550; //width < 700 ? width : 700;
  // let h = ((ymax + 2 * pad) / (xmax + 2 * pad)) * w;
  
  let h = 0.9*window.innerHeight;
  let w = h/((ymax + 2 * pad) / (xmax + 2 * pad));
  
  console.log([w,h,innerWidth, innerHeight])

  let plot = Plot.plot({
    x: { domain: [-pad, xmax + pad], ticks: 0 },
    y: { domain: [-pad, ymax + pad], ticks: 0 },
    width: w,
    height: h,
    marks: [
      // Step 1, the first triangle
      Plot.line(
        [
          [0, 0],
          [xmax, 0],
          [xmax, sa * cb],
          [0, 0]
        ],
        {
          fill: "#d3d3d3",
          stroke: "black",
          strokeWidth: 1,
          title: () => "step1"
        }
      ),
      // Right angle marker
      Plot.line(
        [
          [xmax, d],
          [xmax - d, d],
          [xmax - d, 0]
        ],
        {
          fill: "none",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step1"
        }
      ),
      // Alpha angle marker
      Plot.line(
        [[0, 0]]
          .concat(
            d3
              .range(0, alpha + alpha / 16, alpha / 8)
              .map((t) => [2 * d * Math.cos(t), 2 * d * Math.sin(t)])
          )
          .concat([[0, 0]]),
        {
          fill: "#FF1200",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step1"
        }
      ),

      // Step 2, the second triangle
      Plot.line(
        [
          [0, 0],
          [xmax, sa * cb],
          [cab, ymax],
          [0, 0]
        ],
        {
          fill: "#a1a1a1",
          stroke: "black",
          strokeWidth: 1,
          title: () => "step2"
        }
      ),
      // Right angle marker
      Plot.line(
        [
          [xmax, sa * cb + d],
          [xmax - d, sa * cb + d],
          [xmax - d, sa * cb]
        ].map((pt) => rotate(alpha, xmax, sa * cb)(pt)),
        {
          fill: "none",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step2"
        }
      ),
      // Beta angle marker
      Plot.line(
        [[0, 0]]
          .concat(
            d3
              .range(alpha, alpha + beta + beta / 16, beta / 8)
              .map((t) => [2.2 * d * Math.cos(t), 2.2 * d * Math.sin(t)])
          )
          .concat([[0, 0]]),
        {
          fill: "yellow",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step2"
        }
      ),

      // Step 3, the containing rectangle
      Plot.line(
        [
          [0, 0],
          [xmax, 0],
          [xmax, ymax],
          [0, ymax],
          [0, 0]
        ],
        {
          fill: "none",
          // stroke: "black",
          strokeWidth: 3,
          title: () => "step3"
        }
      ),

      // Step 5 (Step 4 is the 1 implemented in MathJax below)
      // The second alpha marker
      Plot.line(
        [[xmax, sa * cb]]
          .concat(
            d3
              .range(Math.PI / 2, Math.PI / 2 + alpha + alpha / 16, alpha / 8)
              .map((t) => [
                2 * d * Math.cos(t) + xmax,
                2 * d * Math.sin(t) + sa * cb
              ])
          )
          .concat([[xmax, sa * cb]]),
        {
          fill: "#FF1200",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step5"
        }
      ),
      // The alpha' marker
      Plot.line(
        d3
          .range(Math.PI + alpha, (3 * Math.PI) / 2 + alpha / 16, alpha / 8)
          .map((t) => [
            1.6 * d * Math.cos(t) + xmax,
            1.6 * d * Math.sin(t) + sa * cb
          ]),
        {
          fill: "none",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step5"
        }
      ),

      // Step 6
      // The alpha+beta marker
      Plot.line(
        [[cab, ymax]]
          .concat(
            d3
              .range(
                Math.PI,
                Math.PI + alpha + beta + alpha / 16,
                (alpha + beta) / 8
              )
              .map((t) => [
                2 * d * Math.cos(t) + cab,
                2 * d * Math.sin(t) + ymax
              ])
          )
          .concat([[cab, ymax]]),
        {
          fill: "blue",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step6"
        }
      ),
      // The gamma marker
      Plot.line(
        d3
          .range(alpha + beta, Math.PI / 2 + beta / 16, beta / 8)
          .map((t) => [2.4 * d * Math.cos(t), 2.4 * d * Math.sin(t)]),
        {
          fill: "none",
          stroke: "black",
          strokeWidth: 0.5,
          title: () => "step6"
        }
      )
    ]
  });

  // Add the LaTeX snippets
  let s = 2;

  // Step 1
  let alpha_snippet = MathJax.tex2svg(String.raw`\alpha`).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step1 fade9 mathjax")
    .attr("transform", `translate(${0.207 * w}, ${0.88 * h}) scale(${s})`)
    .append(() => alpha_snippet);

  // Step 2
  let beta_snippet = MathJax.tex2svg(String.raw`\beta`).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step2 fade9 mathjax")
    .attr("transform", `translate(${0.188 * w}, ${0.815 * h}) scale(${s})`)
    .append(() => beta_snippet);

  // Step 4
  let one_snippet = MathJax.tex2svg(String.raw`1`).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step4 fade9 mathjax")
    .attr("transform", `translate(${0.375 * w}, ${0.45 * h}) scale(${s})`)
    .append(() => one_snippet);

  // Step 5
  let alpha_snippet2 = MathJax.tex2svg(String.raw`\alpha`).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step5 fade9 mathjax")
    .attr("transform", `translate(${0.878 * w}, ${0.482 * h}) scale(${s})`)
    .append(() => alpha_snippet2);
  let alpha_prime_snippet = MathJax.tex2svg(String.raw`\alpha'`).querySelector(
    "svg"
  );
  d3.select(plot)
    .append("g")
    .attr("class", "step step5 fade9 mathjax")
    .attr("transform", `translate(${0.861 * w}, ${0.633 * h}) scale(${s})`)
    .append(() => alpha_prime_snippet);

  // Step 6
  let alpha_plus_beta_snippet = MathJax.tex2svg(
    String.raw`\alpha+\beta`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step6 fade9 mathjax")
    .attr("transform", `translate(${0.474 * w}, ${0.105 * h}) scale(${s})`)
    .append(() => alpha_plus_beta_snippet);
  let gamma_snippet = MathJax.tex2svg(String.raw`\gamma`).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step6 fade9 mathjax")
    .attr("transform", `translate(${0.135 * w}, ${0.795 * h}) scale(${s})`)
    .append(() => gamma_snippet);

  // Step 7
  let cosb_snippet = MathJax.tex2svg(String.raw`\cos(\beta)`).querySelector(
    "svg"
  );
  d3.select(plot)
    .append("g")
    .attr("class", "step step7 fade9 fade10 mathjax")
    .attr("transform", `translate(${0.5 * w}, ${0.7 * h}) rotate(-25)  scale(${s})`)
    .append(() => cosb_snippet);
  let sinb_snippet = MathJax.tex2svg(String.raw`\sin(\beta)`).querySelector(
    "svg"
  );
  d3.select(plot)
    .append("g")
    .attr("class", "step step7 fade9 fade10 mathjax")
    .attr("transform", `translate(${0.767 * w}, ${0.3 * h}) rotate(65) scale(${s})`)
    .append(() => sinb_snippet);

  // Step 8
  let cosa_cosb_snippet = MathJax.tex2svg(
    String.raw`\cos(\alpha)\cos(\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 fade9 highlight10 mathjax")
    .attr("transform", `translate(${0.45 * w}, ${0.915 * h}) scale(${s})`)
    .append(() => cosa_cosb_snippet);
  let sina_sinb_snippet = MathJax.tex2svg(
    String.raw`\sin(\alpha)\sin(\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 fade9 highlight10 mathjax")
    .attr("transform", `translate(${0.666 * w}, ${0.04 * h}) scale(${s})`)
    .append(() => sina_sinb_snippet);
  let cos_aplusb_snippet = MathJax.tex2svg(
    String.raw`\cos(\alpha+\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 fade9 highlight10 mathjax")
    .attr("transform", `translate(${0.3 * w}, ${0.04 * h}) scale(${s})`)
    .append(() => cos_aplusb_snippet);

  // More step 8!
  let sin_aplusb_snippet = MathJax.tex2svg(
    String.raw`\sin(\alpha+\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 highlight9 fade10 mathjax")
    .attr("transform", `translate(${0.13 * w}, ${0.33 * h}) scale(${s})`)
    .append("g")
    .append(() => sin_aplusb_snippet);
  let cosa_sinb_snippet = MathJax.tex2svg(
    String.raw`\cos(\alpha)\sin(\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 highlight9 fade10 mathjax")
    .attr("transform", `translate(${0.73 * w}, ${0.18 * h}) scale(${s})`)
    .append(() => cosa_sinb_snippet);
  let sina_cosb_snippet = MathJax.tex2svg(
    String.raw`\sin(\alpha)\cos(\beta)`
  ).querySelector("svg");
  d3.select(plot)
    .append("g")
    .attr("class", "step step8 highlight9 fade10 mathjax")
    .attr("transform", `translate(${0.73 * w}, ${0.77 * h}) scale(${s})`)
    .append(() => sina_cosb_snippet);

  // Translate the titles to classes and then remove the titles.
  d3.select(plot)
    .selectAll("g")
    .nodes()
    .forEach(function (node) {
      let nodeD3 = d3.select(node);
      let title = nodeD3.select("title");
      try {
        let text = title.text();
        if (text.length > 4 && text.slice(0, 4) == "step") {
          nodeD3.attr("class", `responsive-stroke step ${text}`);
          title.remove();
        }
      } catch {
        ("pass");
      }
    });
  
  d3.select(plot)
    .style('position', 'absolute')
    .style('top', '30px')
    .style('right', '20px')
    .selectAll(".step")
    .attr("opacity", 0)

  return plot;
}

function rotate(t, x0, y0) {
  return function ([x, y]) {
    return [
      (x - x0) * Math.cos(t) - (y - y0) * Math.sin(t) + x0,
      (y - y0) * Math.cos(t) + (x - x0) * Math.sin(t) + y0
    ];
  };
}
