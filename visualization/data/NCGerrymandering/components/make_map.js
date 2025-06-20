import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import tippyJs from 'https://cdn.jsdelivr.net/npm/tippy.js@6.3.7/+esm'

export function make_map(
  map_data, year, grades, threshold, w, h, projection, path, cities, md) {
  let div = d3
    .create("div")
    .style("overflow", "hidden");
  let svg = div
    .append("svg")
    .attr("viewBox", [0, 0, w, h])
    .attr("width", "100%")
    .style("max-width", `${w}px`);

  let map = svg.append("g");
  let districts = map.append("g");
  districts
    .selectAll("path")
    .data(map_data.get(`congress${year}`).features)
    .join("path")
    .attr("d", path)
    // .attr("stroke", "#333")
    .attr('stroke', 'currentColor')
    .attr("stroke-width", 0.7)
    .attr("fill", function (d) {
      let v =
        grades.get(year).plan.CompetitiveElections[
          ("00" + d.properties.District).slice(-3)
        ];
      if (v < 0.5 - threshold) {
        return d3.interpolateRdBu(0.25);
      } else if (v < 0.5 + threshold) {
        return d3.interpolateRdBu(0.5);
      } else {
        return d3.interpolateRdBu(0.75);
      }
    })
    .on("pointerenter", function (evt, d) {
      districts
        .selectAll("path")
        .attr("stroke-width", 0.7)
        .attr("opacity", 0.7);
      d3.select(this).attr("stroke-width", 3).attr("opacity", 1).raise();
    })
    .on("pointerleave", function () {
      districts.selectAll("path").attr("opacity", 1).attr("stroke-width", 0.7);
    })
    .each(function (d) {
      let district = d.properties.District;
      tippy(this, {
        content: tip(district).outerHTML,
        allowHTML: true,
        theme: "material",
        followCursor: true
      });
    });
  map
    .append("path")
    .attr("d", path(map_data.get("boundary")))
    // .attr("stroke", "black")
    .attr('stroke', 'currentColor')
    .attr("stroke-width", 3)
    .attr("fill", "none");

  map
    .append("g")
    .selectAll("circle.city")
    .data(cities)
    .join("circle")
    .attr("class", "city")
    .attr("cx", (o) => o.x)
    .attr("cy", (o) => o.y)
    .attr("r", 4)
    .attr("fill", "black")
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .attr("pointer-events", "none");
  let city_background_container = map
    .append("g")
    .attr("id", "city_background_container");
  let city_name_display = map.append("g");
  city_name_display
    .selectAll("text.city")
    .data(cities)
    .join("text")
    .attr("class", "city")
    .attr("x", (o) => o.x)
    .attr("y", (o) => o.y)
    .attr("dx", (o) => (o.city == "Winston-Salem" ? (-90 * w) / 1100 : 3))
    .attr("dy", (o) => (o.city == "Winston-Salem" ? (-15 * w) / 1100 : -3))
    .text((o) => o.city)
    .style("font-family", "sans-serif")
    .attr("font-size", (14 * w) / 1100)
    .attr("pointer-events", "none");

  div.node().projection = projection;

  return div.node();

  function tip(District) {
    let district = ("00" + District).slice(-3);
    let grade_data = grades.get(year);
    let DPct = grade_data.plan.CompetitiveElections[district];
    let MVAP = grade_data.plan.MVAPDistricts[district];
    let lean;
    if (DPct < 0.5 - threshold) {
      lean = "Republican";
    } else if (0.5 - threshold <= DPct && DPct <= 0.5 + threshold) {
      lean = "Competitive";
    } else if (0.5 + threshold < DPct) {
      lean = "Democratic";
    }

    return md`**District**: ${District}
- Partisan Lean: ${lean}
- Estimated vote shares:
  - Democratic: ${d3.format("0.1%")(DPct)}
  - Republican: ${d3.format("0.1%")(1 - DPct)}
- Minority Voting Age Population: ${d3.format("0.1%")(MVAP)}
`;
  }
}
