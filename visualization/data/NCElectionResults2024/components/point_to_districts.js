import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

export function point_to_districts(pt, geojsons) {
  const results = Object.keys(geojsons).map(
    key => point_to_district(pt,geojsons[key])
  );
  return results;
}

function point_to_district(pt, geojson) {
  const result = geojson.features.find(
    feature => d3.geoContains(feature,pt)
  )
  return result;
}
