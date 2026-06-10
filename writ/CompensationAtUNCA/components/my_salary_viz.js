import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';


export function prepare_my_salaries(my_salaries, inflation_multipliers) {
  const salaries = my_salaries.map(o => ({...o}));
  for(let i = 0; i < salaries.length; i++) {
    const mult = i == 0 ? 1 : inflation_multipliers[i - 1].inflation_multiplier;
    salaries[i].adjusted_salary = salaries[i].salary / mult;
  }
  return salaries;
}


export function make_my_salary_viz(my_salaries) {
  const w = 900;
  const h = 0.625 * w;
  const svg = d3
    .create("svg")
    .attr("width", "100%")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);
  // .style("border", "solid 1px black");

  const pad = 60;
  const x_scale = d3
    .scaleLinear()
    .domain([1997, 2025])
    .range([pad, w - pad]);
  const y_scale = d3
    .scaleLinear()
    .domain([25000, 100000])
    .range([h - pad, pad]);
  const path0 = d3
    .line()
    .x(o => x_scale(o.academic_year))
    .y(o => y_scale(o.salary));
  const path1 = d3
    .line()
    .x(o => x_scale(o.academic_year))
    .y(o => y_scale(o.adjusted_salary));

  const graph = svg
    .append("path")
    .attr("d", path0(my_salaries))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1);
  const dots = svg.append("g");
  dots
    .selectAll("circle")
    .data(my_salaries)
    .join("circle")
    .attr("cx", o => x_scale(o.academic_year))
    .attr("cy", o => y_scale(o.salary))
    .attr("r", 6)
    .attr("fill", "black");

  svg
    .append("g")
    .style("font-size", "20px")
    .attr("transform", `translate(0, ${h - pad})`)
    .call(d3.axisBottom(x_scale).tickFormat(d3.format("D")).tickSizeOuter(0));
  svg
    .append("g")
    .style("font-size", "20px")
    .attr("transform", `translate(${pad})`)
    .call(
      d3
        .axisLeft(y_scale)
        .tickSizeOuter(0)
        .tickFormat(x => `${x / 1000}K`)
    );

  function update(adjust) {
    if(adjust) {
      dots
        .selectAll("circle")
        .transition()
        .duration(600)
        .attr("cy", o => y_scale(o.adjusted_salary));
      graph.transition().duration(600).attr("d", path1(my_salaries));
    }
    else {
      dots
        .selectAll("circle")
        .transition()
        .duration(600)
        .attr("cy", o => y_scale(o.salary));
      graph.transition().duration(600).attr("d", path0(my_salaries));
    }
  }

  svg.node().update = update;
  return svg.node();
}
