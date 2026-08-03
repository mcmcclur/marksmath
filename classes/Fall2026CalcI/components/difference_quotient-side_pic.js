import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function side_pic() {
  const width = 300;
  const height = 0.8*width;
  const pad = 0;

  const xmin = -1/2, xmax = 2;
  const ymin = -0.5, ymax = 2.1;
  const xrange = xmax-xmin;
  const yrange = ymax-ymin;

  const svg = d3.create("svg")
    .attr('viewBox', [0,0,width,height])
    .style("max-width", `${width}px`);

  const xScale = d3.scaleLinear()
    .domain([xmin,xmax])
    .range([pad, width - pad]);
  const yScale = d3.scaleLinear()
    .domain([ymin,ymax])
    .range([height - pad, pad]);
  const rScale = d3.scaleLinear()
    .domain([0,xrange])
    .range([0, width - pad]);
  const pts_to_path = d3.line()
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); });

	// Draw the axes
	svg.append("g").append("path")
		.attr("d", pts_to_path([[xmin,0],[xmax,0]]))
		.attr("stroke", "currentColor")
		.attr("stroke-width", 0.5)
		.attr("fill", "none");
	svg.append("g").append("path")
		.attr("d", pts_to_path([[0,ymin],[0,0.8*ymax]]))
		.attr("stroke", "currentColor")
		.attr("stroke-width", 0.5)
		.attr("fill", "none");
	// And the tick marks
	const x_ticks = d3.ticks(xmin,xmax,10)
		.map(function(x) {return [[x,0],[x,-yrange/50]]})
	svg.append("g")
		.selectAll("path")
		.data(x_ticks)
		.enter().append("path")
		.attr("d", function(d) {return pts_to_path(d)})
		.attr("stroke", "currentColor")
		.attr("stroke-width", 0.6)
		.attr("class", "ticks");
	const y_ticks = d3.ticks(ymin,ymax,4)
		.map(function(y) {return [[-xrange/80,y],[0,y]]})
	svg.append("g")
		.selectAll("path")
		.data(y_ticks)
		.enter().append("path")
		.attr("d", function(d) {return pts_to_path(d)})
		.attr("stroke", "currentColor")
		.attr("stroke-width", 0.6)
		.attr("class", "ticks");

  // Draw the function
	function f(x) {
		return Math.sin(x*x) + x/2;
	};
	function df(x) {
		return 2*x*Math.cos(x*x) + 1/2;
	}
	const step = xrange/200;
	const pts = d3.range(xmin,xmax+step,step);
	const graph_pts = pts
		.map(function(x) {return [x,f(x)]});
	svg.append("path")
		.attr("d", pts_to_path(graph_pts))
		.attr("stroke", "currentColor")
		.attr("stroke-width", 2)
		.attr("fill", "none");

	const x00 = 1.1;
	const h00 = 0.3;
	let x0_current = x00;
	let h_current = h00;
	draw_tan_sec(x0_current,h_current);


  let timer;
  const x_to_h = d3.scaleLinear()
    .domain([pad, width-pad])
    .range([xmin-x00,xmax-x00])
	svg
		.on("mousemove", function(evt) {
			update(d3.pointer(evt))
		})
		.on("mouseleave", function() {
			timer = d3.timer(trans);
		})
		.on("mouseenter", function() {
			if(window.timer && timer.stop) {
				timer.stop()
			}
		})
  return svg.node();

  function update(xy) {
	const x = xy[0];
    h_current = x_to_h(x);
	draw_tan_sec(x00, h_current)
	}
  function trans() {
    var rate = 0.9;
    var one_minus_rate = 1-rate;
    x0_current = rate*x0_current + one_minus_rate*x00;
    h_current = rate*h_current + one_minus_rate*h00;
    draw_tan_sec(x0_current, h_current)
    if(Math.abs(x0_current - x00) + Math.abs(h_current-h00)<0.01) {
      timer.stop()
      return false
    }
    else {
      return true
    }
  }

	function draw_tan_sec(x0,h) {
		svg.selectAll(".temp").remove();
		const g = svg.append("g")
			.attr("class", "temp");
		const tan_line_f = function(x) {
			return f(x0) + df(x0)*(x-x0)
		}
		const sec_line_f = function(x) {
			return f(x0) + (f(x0+h)-f(x0))*(x-x0)/h
		}
		g.append("path")
			.attr("d", pts_to_path([[xmin,tan_line_f(xmin)],[xmax,tan_line_f(xmax)]]))
			.attr("stroke", "currentColor")
			.attr("stroke-width", 1)
			.attr("fill", "none");
		g.append("path")
			.attr("d", pts_to_path([[xmin,sec_line_f(xmin)],[xmax,sec_line_f(xmax)]]))
			.attr("stroke", "currentColor")
			.attr("stroke-width", 1)
			.attr("fill", "none");
		g.append("circle")
				.attr("class", "temp")
				.attr("cx", xScale(x0))
				.attr("cy", yScale(f(x0)))
				.attr("r", rScale(0.025))
				.attr("fill", "lightgreen")
				.attr("stroke", "currentColor")
				.attr("stroke-width", 1);
		g.append("circle")
				.attr("class", "temp")
				.attr("cx", xScale(x0+h))
				.attr("cy", yScale(f(x0+h)))
				.attr("r", rScale(0.025))
				.attr("fill", "red")
				.attr("stroke", "currentColor")
				.attr("stroke-width", 1);
	}
}








