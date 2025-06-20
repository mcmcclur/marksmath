// Note: The old-school (write HTML then modify with D3) 
// approach to the code here arose simply because I was 
// curious about transferring that type of programming 
// over to Observable. Seems to work, though, certainly 
// not ideal.


import {
  select, 
  selectAll,
  range, 
  scaleLinear,
  timer,
  format,
  line
} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const d3 = {
  select, 
  selectAll,
  range, 
  scaleLinear,
  timer,
  format,
  line
} 

export function do_it(div, width) {
  let container = d3.select(div);
  let svg = container.select("svg");
  let xmin = -10;
  let xmax = 10;
  let dx = 1;
  let ymin = -6;
  let ymax = 4;
  let dy = 1;
  let aspect = 1.1*(ymax - ymin) / (xmax - xmin);

  let grid = d3
    .range(ymin, dy, dy)
    .map((y) => d3.range(xmin - dx, xmax + 2 * dx, dx).map((x) => [x, y]));
  grid = grid.reduce(function (accumulated, currentValue) {
    return accumulated.concat(currentValue);
  }, []);

  let A0 = 0.5;
  let A = A0;
  let alpha0 = 0.5;
  let alpha = alpha0;
  let beta0 = 3;
  let beta = beta0;
  let t0 = 0;
  let pts = grid.map((xy) => p(A, alpha, beta, xy[0], xy[1], t0));
  let outline = pts.slice(pts.length - (xmax - xmin + 3));
  outline.push([xmax, ymin]);
  outline.push([xmin, ymin]);

  let xScale, yScale, rScale, pts_to_path;
  function setup() {
    svg.selectAll("*").remove();
    // let width = 0.8*w;
    let height = aspect * width;
    svg.attr("height", height);
    xScale = d3.scaleLinear().domain([xmin, xmax]).range([0, width]);
    rScale = d3
      .scaleLinear()
      .domain([0, xmax - xmin])
      .range([0, width]);
    yScale = d3.scaleLinear().domain([ymin, ymax]).range([height, 0]);
    pts_to_path = d3
      .line()
      .x(function (d) {
        return xScale(d[0]);
      })
      .y(function (d) {
        return yScale(d[1]);
      });

    svg
      .append("path")
      .attr("d", pts_to_path(outline))
      .attr("fill", "lightblue")
      .attr("stroke", "blue")
      .attr("stroke-width", "2px");
    let circles = svg
      .selectAll("circle")
      .data(pts)
      .join("circle")
      .attr("class", "water")
      .attr("cx", function (d) {
        return xScale(d[0]);
      })
      .attr("cy", function (d) {
        return yScale(d[1]);
      })
      .attr("r", 3)
      .attr("fill", "black")
      .attr("stroke", "black")
      .attr("stroke-width", 1);
    let to_highlight = circles
      .filter(function (d, i) {
        let i1 = Math.round(pts.length - (xmax - xmin + 3) / 2);
        let i2 = 2 * Math.round(pts.length / 4 - (xmax - xmin) / 2);
        return i == i1 || i == i2;
      })
      .attr("class", "highlight");
  }

  function start(t) {
    pts = grid.map((xy) => p(A, alpha, beta, xy[0], xy[1], t / 1000));
    outline = pts.slice(grid.length - (xmax - xmin + 3));
    outline.push([xmax, ymin]);
    outline.push([xmin, ymin]);
    svg
      .selectAll("path")
      .transition()
      .duration(0)
      .attr("d", pts_to_path(outline));
    svg
      .selectAll("circle")
      .data(pts)
      .transition()
      .duration(0)
      .attr("cx", function (d) {
        return xScale(d[0]);
      })
      .attr("cy", function (d) {
        return yScale(d[1]);
      });
  }

  function p(A, alpha, beta, x0, y0, t) {
    let r = A * Math.exp(alpha * y0);
    let arg = alpha * x0 - beta * t;
    let x = x0 + r * Math.cos(arg);
    let y = y0 + r * Math.sin(arg);
    return [x, y];
  }

  setup();
  let timer = d3.timer(start);

  container
    .select("#A")
    .property("value", A0)
    .on("input", function () {
      A = parseFloat(d3.select("#A").property("value"));
      container.select("#A_value").text(d3.format("0.2f")(A));
    });
  container.select("#A_value").text(d3.format("0.2f")(A));
  container
    .select("#alpha")
    .property("value", alpha0)
    .on("input", function () {
      alpha = parseFloat(d3.select("#alpha").property("value"));
      container.select("#alpha_value").text(d3.format("0.2f")(alpha));
    });
  container.select("#alpha_value").text(d3.format("0.2f")(alpha));
  container
    .select("#beta")
    .property("value", beta0)
    .on("mouseup", function () {
      beta = parseFloat(d3.select("#beta").property("value"));
      container.select("#beta_value").text(d3.format("0.2f")(beta));
    });
  container.select("#beta_value").text(d3.format("0.2f")(beta));
  container
    .select("#toggle_circles")
    .property("checked", false)
    .on("click", function () {
      if (d3.select("#toggle_circles").property("checked")) {
        d3.selectAll("circle.highlight").attr("r", 6).attr("fill", "yellow");
      } else {
        d3.selectAll("circle.highlight").attr("r", 3).attr("fill", "black");
      }
    });
}


  
