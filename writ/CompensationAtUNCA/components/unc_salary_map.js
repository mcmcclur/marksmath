import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import tippy from "https://cdn.jsdelivr.net/npm/tippy.js@6/+esm";
import {feature} from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

export function make_map(nc_topo, raw_cohort, opts = {}) {
  const {
    width = 600,
    height = 280,
    cohortName = "UNC System",
    highlightedUnitId = 199111111
  } = opts;

  const nc = feature(nc_topo, nc_topo.objects.nc);
  const projection = d3.geoIdentity().reflectY(true).fitSize([width, height], nc);
  const path = d3.geoPath().projection(projection);
  const cohort = raw_cohort
    .filter((d) => d.cohort === cohortName)
    .map((d) => {
      const [x, y] = projection([+d.x, +d.y]);
      return {
        ...d,
        UNITID: +d.UNITID,
        cost_index: +d.cost_index,
        salary: +d.salary,
        adjusted_salary: (100 * +d.salary) / +d.cost_index,
        xx: x,
        yy: y
      };
    });

  const adjustedSalaryScale = d3
    .scaleLinear()
    .domain([
      0.9 * d3.min(cohort, (d) => d.adjusted_salary),
      d3.max(cohort, (d) => d.adjusted_salary)
    ])
    .range([0, 1]);

  const container = d3
    .create("div")
    .attr("class", "unc-salary-map")
    .style("max-width", "100%")
    .style("overflow", "hidden");

  const svg = container
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("role", "img")
    .attr("aria-label", "Map of UNC System schools sized and shaded by cost-of-living adjusted faculty salary.");

  const map = svg.append("g");

  map
    .append("g")
    .selectAll("path")
    .data(nc.features)
    .join("path")
    .attr("fill", "lightblue")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.7)
    .attr("d", path);

  const schools = map
    .append("g")
    .selectAll("circle")
    .data(cohort)
    .join("circle")
    .attr("fill", (d) => d3.interpolateReds(1 - 0.8 * adjustedSalaryScale(d.adjusted_salary)))
    .attr("stroke", (d) => d.UNITID === highlightedUnitId ? "#003DA5" : "darkslategray")
    .attr("stroke-width", (d) => d.UNITID === highlightedUnitId ? 2.5 : 1)
    .attr("r", (d) => Math.sqrt((60 * adjustedSalaryScale(d.adjusted_salary) * width) / 1100))
    .attr("cx", (d) => d.UNITID === 199102 ? d.xx + (5 * width) / 1100 : d.xx)
    .attr("cy", (d) => d.yy)
    .attr("data-school-name", (d) => d.INSTNM)
    .on("mouseenter", function () {
      d3.select(this).attr("stroke-width", 3);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke-width", d.UNITID === highlightedUnitId ? 2.5 : 1);
    });

  schools.each(function (d) {
    tippy(this, {
      animation: false,
      arrow: true,
      theme: "light-border",
      content: d.INSTNM
    });
  });

  return container.node();
}
