import {
  create, 
  scaleLinear, 
  line, 
  timer
} from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = {
  create, 
  scaleLinear, 
  line, 
  timer
}
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function draw_orbit(orbit) {
  const w = 960;
  const h = 600;
  const pad = 20;
  const svg = d3.create('svg')
    .attr('viewBox', [0,0,w,h])
    .style('max-width', `${w}px`)
  
  const xmin = -0.4;
	const xmax = 1.2;
	const ymin = -0.5;
	const ymax = 0.5;
  const xScale = d3.scaleLinear()
		.domain([xmin,xmax])
		.range([pad, w - pad]);
	const yScale = d3.scaleLinear()
		.domain([ymin,ymax])
		.range([h - pad, pad]);
	const rScale = d3.scaleLinear()
		.domain([0,xmax-xmin])
		.range([0, w - pad]);
	const pt_dict_to_path = d3.line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y));
    
  svg.append("path")
  		.attr("d", pt_dict_to_path(orbit))
  		// .attr("stroke", "black")
  		.attr("stroke-width", 2)
  		.attr("fill", "none")
      .attr('class', 'responsive-stroke')

  svg.append('circle')
    .attr('cx', xScale(0))
    .attr('cy', yScale(0))
    .attr('r', rScale(0.03))
    .attr('fill', 'yellow')
    .attr('stroke', '#d1d119')
    .attr('stroke-width', 4);
  
  let earth_info = orbit[0];
  const earth = svg
    .append("circle")
		.attr("class", "earth")
		.attr("cx", xScale(earth_info.x))
		.attr("cy", yScale(earth_info.y))
		.attr("r", rScale(0.015))
		.attr("fill", "#1c96c5")
		// .attr("stroke", "#00d")
    .attr('class', 'responsive-stroke')
		.attr("stroke-width", 1);
  
  const speed = 1/3;
  let start_time = Date.now();
  let elapsed = 0;
  let stop_time = Date.now();
  let t1 = 400;
  let t2 = 1500;
  let timer;
  
  const p1 = svg
    .append("circle")
		.attr("class", "start")
		.attr("r", rScale(0.01))
		.attr("fill", "#1f1")
		// .attr("stroke", "#00d")
    .attr('class', 'responsive-stroke')
		.attr("stroke-width", 1)
    .attr('opacity', 0);
  const p2 = svg
    .append("circle")
		.attr("class", "stop")
		.attr("r", rScale(0.01))
		.attr("fill", "#f11")
		// .attr("stroke", "#00d")
    .attr('class', 'responsive-stroke')
		.attr("stroke-width", 1)
    .attr('opacity', 0)
      
  svg.node().startstop = startstop;
  svg.node().move_point = move_point;
  svg.node().get_info = get_info;
  svg.node().show_hide_pts = show_hide_pts;
  return svg.node();
  
  function show_hide_pts(show) {
    if(show) {
      p1
        .transition()
        .duration(400)
        .attr('opacity', 1);
      p2
        .transition()
        .duration(400)
        .attr('opacity', 1);
    } else {
      p1
        .transition()
        .duration(400)
        .attr('opacity', 0);
      p2
        .transition()
        .duration(400)
        .attr('opacity', 0);
    }
  }
  
  function get_info(start_idx, stop_idx) {
    const frame_number = Math.floor(
      elapsed*speed) % 1000;
    const start_info = orbit[
      Math.floor(start_idx*speed)
    ];
    const stop_info = orbit[
      Math.floor(stop_idx*speed)
    ];
  	const x_start = start_info.x;
  	const y_start = start_info.y;
  	const x_stop = stop_info.x;
  	const y_stop = stop_info.y;
    const dt = stop_info.t - start_info.t;
  	const dist = Math.sqrt(Math.pow(x_start-x_stop,2)+Math.pow(y_start-y_stop,2));
    
    return {
      dist, dt, 
      avg_vel: dist/dt,
      inst_vel: earth_info.speed
    }
  }
  
  function move_point(pt_id, t) {
    let pt;
    if(pt_id == 1) {
      pt = p1;
    }
    else {
      pt = p2;
    }
    const frame_number = Math.floor(t*speed) % 1000;
    const pt_info = orbit[frame_number];
    pt 
      .attr("cx", function() { 
        return xScale(pt_info.x)}
      )
  		.attr("cy", function() {
        return yScale(pt_info.y)}
      )
  }
  
  function startstop(running) {
    if(running) {
			elapsed = elapsed + Date.now() - stop_time;
			timer = d3.timer(move_earth);
		}
		else {
			stop_time = Date.now();
      timer.stop()
		}
  }
  
  function move_earth() {
    const frame_number = Math.floor(
      (Date.now()-start_time-elapsed)*speed) % 1000;
  	earth_info = orbit[frame_number];
    earth 
      .attr("cx", function(d) { 
        return xScale(earth_info.x)}
      )
      .attr("cy", function(d) {
        return yScale(earth_info.y)}
      )
  }
}
