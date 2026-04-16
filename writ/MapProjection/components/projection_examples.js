import * as d3Base from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as d3GeoProjection from "https://cdn.jsdelivr.net/npm/d3-geo-projection@4/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

export const d3 = { ...d3Base, ...d3GeoProjection };

export const projectionOptions = [
  {
    name: "Equirectangular",
    projection: d3.geoEquirectangularRaw,
    comment: `The equirectangular projection is probably the simplest of all map projections. A point on the globe with latitude φ and longitude θ simply maps to the point (θ,φ). The resulting latitude lines, also called parallels, are all horizontal and all have the same length. We call a map with this property *cylindrical*.

In spite of its simplicity, the equirectangular projection does not have many nice properties. Angles, areas, distances, and shapes are all greatly distorted.`
  },
  {
    name: "Mercator",
    projection: d3.geoMercatorRaw,
    comment: `Gerardus Mercator created his projection in 1569. It represented a major breakthrough in navigation because paths of constant compass bearing are represented as straight lines. Ultimately, this property follows from the fact that Mercator's projection is a *conformal, cylindrical projection*.`
  },
  {
    name: "Lambert's cylindrical equal area",
    projection: d3.geoCylindricalEqualAreaRaw(0),
    comment: `The mathematician Johann Lambert created this projection in 1772. Its somewhat long-winded name arises from the fact that Lambert was a pioneer in map projection and created quite a few of them. Like the previous projections, this projection is cylindrical. Unlike those, this projection is *equal area*; that is, it represents equal areas on the globe with equal areas on the map. It has minimal distortion near the equator but unbounded distortion near the poles.`
  },
  {
    name: "Gall-Peters projection",
    projection: d3.geoCylindricalEqualAreaRaw(Math.PI / 4),
    comment: `The Gall-Peters map is another cylindrical, equal area map. Unlike Lambert's projection, it has minimal distortion at two parallels, namely ±45°, and less overall distortion.

The Gall-Peters map was first constructed in 1855 by James Gall and rediscovered in 1967 by Arno Peters. Peters vigorously promoted the map as superior to Mercator's, which he described as advantageous to Northern countries since their area is inflated.`
  },
  {
    name: "Sinusoidal",
    projection: d3.geoSinusoidalRaw,
    comment: `The sinusoidal map is another equal area map but, rather than cylindrical, it is *pseudo-cylindrical*. This simply means that, while all the parallels are horizontal, they need not have the same length. As a result, the lines of constant longitude, also called meridians, are curved; they are sinusoidal curves, in fact.`
  },
  {
    name: "Equal Earth",
    projection: d3.geoEqualEarthRaw,
    comment: `The Equal Earth map projection is another pseudo-cylindrical, equal area map projection. It was devised in 2018 as a map that has much less overall distortion than the Gall-Peters projection, as well as nicer aesthetic features.`
  },
  {
    name: "Polar stereographic",
    projection: d3.geoStereographicRaw,
    polar: true,
    comment: `Conceptually, a *stereographic projection* is not projected onto a cylinder surrounding the sphere but, rather, to a plane that is tangent to the sphere. Projections onto a plane are also often called *azimuthal projections*. The plane can be tangent at any point, but the point of tangency is often the North or South pole to map polar regions. As a result, the parallels map to concentric circles and the meridians to rays emanating from the pole. In the stereographic projection, the parallels are spaced to make the map conformal.`
  },
  {
    name: "Azimuthal equidistant",
    projection: d3.geoAzimuthalEquidistantRaw,
    polar: true,
    comment: `As the name suggests, this is another example of an azimuthal projection. For an azimuthal equidistant projection, the distance from any point on the map to the point of tangency with the projection plane is proportional to the distance to the corresponding point on the globe. As a result, the map is equidistant in the sense that distances are represented correctly relative to this central point.`
  },
  {
    name: "Conic conformal",
    projection: d3.geoConicConformalRaw(Math.PI / 6, Math.PI / 3),
    comment: `A conic projection is created by projecting onto a cone, producing a shape like the one seen here. The meridians map to radial lines that converge to a center which is often a pole. Parallels map to portions of circles concentric about the pole. In this case, those parallels are spaced to make the map conformal.

Conic projections are not particularly appropriate for a world map, but they often display relatively small distortion at mid and high latitudes. As a result, they are a common choice to map large portions of one hemisphere, like North America.`
  },
  {
    name: "Conic equal area",
    projection: d3.geoConicEqualAreaRaw(Math.PI / 6, Math.PI / 3),
    comment: `If we space the parallels of a conic projection appropriately, then we can make it an equal area map.`
  },
  {
    name: "Robinson",
    projection: d3.geoRobinsonRaw,
    comment: `Arthur Robinson created his map projection in 1963. While this is again a pseudo-cylindrical projection, it is neither equal area nor conformal; rather, it was specifically produced in an attempt to minimize both area and angle distortion. The National Geographic Society used the Robinson projection for its world maps from 1988 to 1998.`
  },
  {
    name: "Aitoff",
    projection: d3.geoAitoffRaw,
    comment: `Aitoff's map is a horizontally stretched, equidistant azimuthal map with central point on the equator. David Aitoff created it in 1889 in an attempt to find a projection that is neither equal area nor conformal but rather a compromise between the two.`
  },
  {
    name: "Winkel Tripel",
    projection: d3.geoWinkel3Raw,
    comment: `The Winkel Tripel was created by Oswald Winkel in 1921. His objective was to minimize the combined distortion of three different quantities, area, direction, and distance; hence, the name "tripel". He did this by taking an average of two other map projections, the equirectangular and the Aitoff. The result is neither cylindrical nor azimuthal; rather, it is a composite map.`
  }
];

export function createProjectionState(initialProjection = d3.geoEquirectangularRaw) {
  return { projections: [{ projection: initialProjection }] };
}

export function advanceProjectionState(state, projection) {
  state.projections.push(projection);
}

export function loadLandFeature(landTopology) {
  return topojson.feature(landTopology, landTopology.objects.ne_110m_land);
}

export function projectionTransitionPic(p0, p1, t, landFeature) {
  const w = 800;
  const h = 0.625 * w;
  const proj = interpolateProjection(p0, p1, w, h, landFeature)(t);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);

  // svg.append('rect')
  //   .attr('width', '100%')
  //   .attr('height', '100%')
  //   .attr('fill', '#9bb4bb');

  const path = d3.geoPath().projection(proj);
  const graticule = d3.geoGraticule().extent([
    [-180, -85],
    [180, 85]
  ])();

  svg
    .append("g")
    .selectAll("path.graticule")
    .data([graticule])
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.4);

  svg
    .append("g")
    .selectAll("path.land")
    .data(landFeature.features)
    .join("path")
    .attr("class", "land")
    .attr("d", path)
    // .attr("fill", "#eee")
    .attr('fill', '#fff')
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("opacity", 1);

  return svg.node();
}

export function renderAnimatedProjectionMap(
  state,
  projection,
  landFeature,
  invalidation,
  {
    step = 0.05,
    interval = 20
  } = {}
) {
  const frame = document.createElement("div");
  const p0 = state.projections.slice(-2)[0];
  const p1 = state.projections.slice(-1)[0];
  let timer = null;
  let stopped = false;

  function draw(t) {
    frame.replaceChildren(
      projectionTransitionPic(p0, p1, d3.easeCubicInOut(t), landFeature)
    );
  }

  draw(0);

  let t = 0;
  timer = setInterval(() => {
    if (stopped) return;
    t += step;
    draw(Math.min(t, 1));
    if (t >= 1) {
      clearInterval(timer);
    }
  }, interval);

  invalidation.then(() => {
    stopped = true;
    if (timer) clearInterval(timer);
  });

  return frame;
}

function interpolateProjection(p0, p1, w, h, landFeature) {
  const {
    scale: scale0,
    translate: translate0,
    rotate: rotate0
  } = fit(p0.projection, p0.polar);
  const {
    scale: scale1,
    translate: translate1,
    rotate: rotate1
  } = fit(p1.projection, p1.polar);

  return (t) =>
    d3
      .geoProjection((x, y) => lerp2(p0.projection(x, y), p1.projection(x, y), t))
      .scale(lerp1(scale0, scale1, t))
      .translate(lerp2(translate0, translate1, t))
      .rotate(lerp2(rotate0, rotate1, t));

  function fit(raw, polar) {
    const p = d3.geoProjection(raw);
    p.fitExtent(
      [
        [0.5, 0.5],
        [w - 0.5, h - 0.5]
      ],
      landFeature
    );
    if (polar) {
      p.rotate([0, -90]).scale(200);
    }
    return { scale: p.scale(), translate: p.translate(), rotate: p.rotate() };
  }
}

function lerp1(x0, x1, t) {
  return (1 - t) * x0 + t * x1;
}

function lerp2([x0, y0], [x1, y1], t) {
  return [(1 - t) * x0 + t * x1, (1 - t) * y0 + t * y1];
}


export function plain_pic(land, proj, opts = {}) {
  let { w = 600, h = 400 } = opts;

  let svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, w, h])
    .style("max-width", `${w}px`);
  // .style("border", "solid 1px black");

  proj.fitSize([w, h], land);
  if (opts.scale) {
    proj.scale(opts.scale);
  }
  if (opts.translate) {
    proj.translate(opts.translate);
  }

  let path = d3.geoPath().projection(proj);

  let graticule = d3.geoGraticule().extent([
    [-180, -90],
    [180, 90]
  ])();

  // Draw the graticule
  let graticule_path = svg
    .append("g")
    .selectAll("path.graticule")
    .data([graticule])
    .join("path")
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 0.4);

  // Draw the countries
  let land_group = svg.append("g");
  land_group
    .selectAll("path.land")
    .data(land.features)
    .join("path")
    .attr("class", "land")
    .attr("d", path)
    .attr("fill", "#eee")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("opacity", 1);

  return svg.node();
}