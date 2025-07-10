import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as math from 'https://cdn.jsdelivr.net/npm/mathjs@14.3.0/+esm'


// The main function
export function eigen_pic(M, arrows, opts = {}) {
  const {
    domain = [
      [-3, 3],
      [-3, 3]
    ],
    dd = 0.2
  } = opts;

  let MInv;
  const MM = math.matrix(M);
  if (math.det(MM)) {
    MInv = math.inv(MM);
  }

  const w = 500;
  const h = 500;
  const svg = d3
    .create("svg")
    .attr("width", "100%")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);
  const [xmin, xmax] = domain[0];
  const [ymin, ymax] = domain[1];
  const xrange = xmax - xmin;

  const pad = 50;
  const x_scale = d3
    .scaleLinear()
    .domain([xmin, xmax])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([ymin, ymax])
    .range([h - pad, pad]);
  const r_scale = d3.scaleLinear().domain([0, xrange]).range([0, w]);
  const v_scale = d3
    .scaleLinear()
    .domain([0, w])
    .range([-2,2])

  const pts = d3
    .range(xmin, xmax + dd / 2, dd)
    .map((x) => d3.range(ymin, ymax + dd / 2, dd).map((y) => [x, y]))
    .flat(1);

  const image = svg.append("g");
  const pt_group = image.append("g").attr("id", "points");
  pt_group
    .selectAll("circle")
    .data(pts)
    .join("circle")
    .attr("cx", (d) => x_scale(d[0]))
    .attr("cy", (d) => y_scale(d[1]))
    .attr("data-pt", (d) => d)
    .attr("r", r_scale(xrange / 500))
    .attr("fill", "black");

  const arrow_group = image.append("g").attr("id", "arrows");
  arrows.forEach(function (a) {
    arrow_group
      .append("polyline")
      .call(arrow, x_scale(0), y_scale(0), x_scale(a[0]), y_scale(a[1]), {
        data_info: a
      })
      .attr("stroke", "black")
      .attr("stroke-width", 3);
  });

  const axes = image.append("g");
  axes
    .append("g")
    .attr("transform", `translate(${x_scale(0)}, 0)`)
    .call(d3.axisLeft(y_scale).ticks(5).tickSizeOuter(0));
  axes
    .append("g")
    .attr("transform", `translate(0, ${y_scale(0)})`)
    .call(d3.axisBottom(x_scale).ticks(5).tickSizeOuter(0));

  svg.on("pointermove", pointermove);
  svg.on("pointerleave", pointerleave);
  return svg.node();

  function pointerleave() {
	pt_group
	  .selectAll("circle")
	  .transition()
	  .duration(400)
	  .attr("cx", (d) => x_scale(d[0]))
	  .attr("cy", (d) => y_scale(d[1]));
	arrow_group
	  .selectAll("polyline")
	  .transition()
	  .duration(400)
	  .attr("points", function(d,i) {
		const a = arrows[i];
		const polypts = arrow_pts(x_scale(0), y_scale(0), x_scale(a[0]), y_scale(a[1]));
		return polypts;
		// return arrow_pts(x_scale(0), y_scale(0), x_scale(a[0]), y_scale(a[1]));
	  });
  }
  function pointermove(evt) {
	const [x, y] = d3.pointer(evt);
	const v = v_scale(x);
	arrow_group
	  .selectAll("polyline")
	  .remove();
	arrows.forEach(function (a, i) {
		const s = i == 0 ? 2 : 1/2;
		arrow_group
		.append("polyline")
		.call(arrow, x_scale(0), y_scale(0), x_scale(s**v * a[0]), y_scale(s**v * a[1]))
		.attr("stroke", "black")
		.attr("stroke-width", 3);
	});
	pt_group
	  .selectAll("circle")
	  .attr("cx", function(d) {
		const [xx,yy] = T(v)(d[0], d[1]);
		return x_scale(xx);
	  })
	  .attr("cy", function(d) {
		const [xx,yy] = T(v)(d[0], d[1]);
		return y_scale(yy);
	  })
  }
}



// Convenience functions to make some arrows.

function arrow(selection, ax, ay, bx, by, opts = {}) {
  const { data_info = false } = opts;
  const pts = arrow_pts(ax, ay, bx, by, opts);
  selection.attr("points", pts)
    .attr("stroke-linejoin", "round");
  if (data_info) {
    selection.attr("data-info", data_info);
  }
  return selection;
}

function arrow_pts(ax, ay, bx, by, options = {}) {
  const dx = bx - ax;
  const dy = by - ay;
  const length = Math.sqrt(dx ** 2 + dy ** 2);

  const ux = dx / length;
  const uy = dy / length;

  const nx = -uy;
  const ny = ux;

  const h = options.arrowLength || 8;
  const w = options.arrowWidth || 4;

  const mx = bx - ux * h;
  const my = by - uy * h;

  const lx = mx - (nx * w) / 2;
  const ly = my - (ny * w) / 2;

  const rx = mx + (nx * w) / 2;
  const ry = my + (ny * w) / 2;

  return [ax, ay, mx, my, lx, ly, bx, by, rx, ry, mx, my];
}

function T(s) {
	return (x,y) => [
		(2**(1 - s)/3 + 2**s/3)*x + (-1/3*2**(1 - s) + 2**(1 + s)/3)*y,
		(-1/3*1/2**s + 2**s/3)*x + (1/(3*2**s) + 2**(1 + s)/3)*y
	]
}
