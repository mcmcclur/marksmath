import { json } from "https://cdn.jsdelivr.net/npm/d3-fetch@3/+esm";

export function nominatim({
  server = "https://nominatim.openstreetmap.org",
  q,
  amenity,
  street,
  city,
  county,
  state,
  country,
  postalcode,
  limit,
  format = "json"
} = {}) {
  let query = `${server}/search?`;

  if (q != undefined) {
    query += `q=${q.replaceAll(" ", "+")}`;
  }

  if (amenity != undefined) {
    query += `&amenity=${amenity}`;
  }

  if (street != undefined) {
    query += `&street=${street}`;
  }

  if (city != undefined) {
    query += `&city=${city}`;
  }

  if (county != undefined) {
    query += `&county=${county}`;
  }

  if (state != undefined) {
    query += `&state=${state}`;
  }

  if (country != undefined) {
    query += `&country=${country}`;
  }

  if (postalcode != undefined) {
    query += `&postalcode=${postalcode}`;
  }

  if (limit != undefined) {
    query += `&limit=${limit}`;
  }

  query += `&format=${format}`;

  return json(query);
}
