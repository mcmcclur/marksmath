import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import tippy from 'https://cdn.jsdelivr.net/npm/tippy.js@6/+esm';


export function make_salary_viz(summary_data, opts = {}) {
  const {
    animate = false,
    tooltips = true
  } = opts;
  const w = 850;
  const h = 300;
  const pad = 50;
  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    // .style("border", "solid 1px black");

  const x_scale = d3
    .scaleBand()
    .domain(summary_data.map((o) => o.abbr))
    .range([pad, w - pad])
    .padding(0.2);
  const max_value = 210000; 
  const y_scale = d3
    .scaleLinear()
    .domain([0, max_value])
    .range([h - pad, pad]);

  const bars = svg
    .append("g")
    .selectAll("rect")
    .data(summary_data)
    .join("rect")
    .attr('class', d => d.abbr)
    .attr("x", (d) => x_scale(d.abbr))
    .attr("y", (d) => y_scale(d.val))
    .attr("height", (d) => y_scale(0) - y_scale(d.val))
    .attr("width", x_scale.bandwidth())
    .attr("fill", o => o.abbr != "UNCA" ? "lightblue" : '#003DA5')
    .on('pointerenter', function() {
      d3.select(this)
        .attr('stroke-width', 2)
        .attr('stroke', 'black')
    })
    .on('pointerleave', function() {
      svg.selectAll('rect')
        .attr('stroke', null)
    });
    if(tooltips) {
      bars.each(function(d) {
        tippy(this, {
            allowHTML: true,
            theme: 'light-border',
            content: `
            <div style="font-weight: bold">${d.school}</div>
            <div><span style="font-style: italic">Avg Salary:</span> $${Math.round(d.average_salary)}</div>
            <div><span style="font-style: italic">CoL:</span> ${Math.round(d.CoL)}</div>
            <div><span style="font-style: italic">Adjusted:</span> $${Math.round(d.adjusted_average_salary)}</div>
            `,
            animation: false,
            arrow: true
        })
      });
    }

  const x_axis = svg
    .append("g")
    .attr("transform", `translate(0,${h - pad})`)
    .call(d3.axisBottom(x_scale).tickSizeOuter(0));
  const y_axis = svg
    .append("g")
    .attr("transform", `translate(${pad})`)
    .call(d3.axisLeft(y_scale).tickSizeOuter(0));
  y_axis.select("path.domain").attr("stroke", null);

  if(animate) {
    bars
      .nodes()
      .forEach(function (r, i) {
        let dr = d3.select(r);
        let y = +dr.attr("y");
        let h = +dr.attr("height");
        let Y = h + y;
        dr.attr("y", Y).attr("height", 0);
        delay(150).then(() => {
            delay(50 * i).then(() =>
            dr
                .attr("y", Y)
                .attr("height", 0)
                .transition()
                .duration(200)
                .attr("y", y)
                .attr("height", h)
            );
        });
      });
  }



  return svg.node();
}


export function summarize_data(data, group, sort_by, col_adjust) {
  const filtered_data = group == "All" ? data : data.filter(o => o.group == group)
  const summary_data = d3.rollups(
    filtered_data,
    a => ({
      abbr: a[0].school_abbr,
      school: a[0].school_name,
      average_salary: d3.mean(a, o => o.salary),
      CoL: a[0].CoL
    }),
    o => o.school_abbr
  ).map(a => a[1]);

  summary_data.forEach(function(o) {
    o.adjusted_average_salary = 100*o.average_salary/o.CoL;
    if(col_adjust) {
      o.val =  o.adjusted_average_salary
    } else {
        o.val = o.average_salary
      }
    });
  if(sort_by == "Avg Salary") {
    return d3.sort(summary_data, o => -o.val);
  }
  else {
    return summary_data;
  }
}

function delay(duration, value) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(value);
    }, duration);
  });
}
