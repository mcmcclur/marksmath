import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import mapboxgl from "https://esm.sh/mapbox-gl@3.12.0";

// mapboxgl.accessToken = window.MAPBOX_CYCLING_TOKEN;
mapboxgl.accessToken = MAPBOX_CYCLING_TOKEN;


////////////////////////////
// The main function.

export function make_map(MAPBOX_CYCLING_TOKEN) {
  const map = new mapboxgl.Map({
    container: 'map',
    zoom: 11, 
    center: [-82.5599, 35.5753],
    style: "mapbox://styles/mapbox/outdoors-v12"
  });

  // Add standard controls to the map on load.
  map.on("load", async function () {
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right"
    );
    map.addControl(
      new mapboxgl.GeolocateControl({ trackUserLocation: true }),
      "top-right"
    );
    d3.select("#map").selectAll('button').classed('responsive-fill')
    
    const params = new URLSearchParams(location.search);
    const gpx = params.get('gpx');
    if(gpx) {
      try{
        fetch(`https://marksmath.org/data/GPXFiles/${gpx}.gpx`)
          .then(async function(r) {
            const file_string = await r.text();
            const pts = get_trkpts(file_string);
            add_path(map, pts);
            make_elevation_chart(pts, map)
          })
      } catch {
        "pass"
      }
    }
  }); 
  
  // Expose some functionality.
  map.add_path = add_path;
  map.make_elevation_chart = make_elevation_chart;
  return map;
}



/////////////////////////////////////////
// Parse the GPX file to a list of points

// We use the DOMParser to read GPX files.
const parser = new DOMParser();

// Parse the GPX file and return a list of [lat,lon] points.
// Each point optionally has ele(vation) and time keys.
export function get_trkpts(file_string) {
  let parsed = parser.parseFromString(file_string, "text/xml");
  let trkpts = parsed.getElementsByTagName("trkpt");
  let pts = [];
  for (let trkpt of trkpts) {
    let pt = [
      parseFloat(trkpt.getAttribute("lon")),
      parseFloat(trkpt.getAttribute("lat"))
    ];
    try {
      let ele = trkpt.getElementsByTagName("ele")[0].textContent;
      pt.ele = 3.28084 * parseFloat(ele);
    } catch (e) {
      ("pass");
    }
    try {
      let time = trkpt.getElementsByTagName("time")[0].textContent;
      pt.time = parseTime(time);
    } catch (e) {
      ("pass");
    }
    pts.push(pt);
  }
  let lons = pts.map((pt) => pt[0]);
  pts.min_lon = d3.min(lons);
  pts.max_lon = d3.max(lons);
  let lats = pts.map((pt) => pt[1]);
  pts.min_lat = d3.min(lats);
  pts.max_lat = d3.max(lats);
  return pts;
}

function parseTime(s) {
  let t1 = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ")(s);
  let t2 = d3.utcParse("%Y-%m-%dT%H:%M:%SZ")(s);
  if (t1) {
    return t1;
  } else {
    return t2;
  }
}



////////////////////////////////////////
// Add the path determined by a GPX file
function add_path(map, pts) {  
  // Remove the path, if already there
  if (map.getLayer("path")) {
    map.removeLayer("path");
  }
  if (map.getSource("route")) {
    map.removeSource("route");
  }
  // And the start stop markers, too.
  if (map.start_marker) {
    map.start_marker.remove();
    map.start_marker = null;
  }
  if (map.stop_marker) {
    map.stop_marker.remove();
    map.stop_marker = null;
  }

  // Add geoJSON describing the route
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: pts
          }
        }
      ]
    }
  });
  // Use the geoJSON to add the layer
  map.addLayer({
    id: "path",
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round"
    },
    paint: {
      "line-color": "#00b",
      "line-width": 5
    }
  });

  // Add the markers
  map.start_marker = new mapboxgl.Marker({ color: "#00dd00" })
    .setLngLat(pts[0])
    .addTo(map);
  map.stop_marker = new mapboxgl.Marker({ color: "#dd0000" })
    .setLngLat(pts.slice(-1)[0])
    .addTo(map); // marker.remove();

  // Fit the map to the new path. Note that
  // fit=false, when called after a change of map_style
  // if (fit) {
  map.setMaxBounds(null);

  let lon_range = pts.max_lon - pts.min_lon;
  let lat_range = pts.max_lat - pts.min_lat;

  let r = 0.2;
  let min_lon = pts.min_lon - lon_range * r;
  let max_lon = pts.max_lon + lon_range * r;
  let min_lat = pts.min_lat - lat_range * r;
  let max_lat = pts.max_lat + lat_range * r;
  map.fitBounds(
    [
      [min_lon, min_lat],
      [max_lon, max_lat]
    ],
    { duration: 1600 }
  );
}



///////////////////////
// The Elevation chart 

const formatTime = d3.timeFormat("%a, %b %e, %Y");

function make_elevation_chart(trkpts, map) {
  let size = d3.min([window.innerWidth, window.innerHeight]);
  let w = size < 600 ? 0.98 * size : 600;
  let h = w / 3;

  let pad_left = 40;
  let pad_bottom = 20;
  let svg = d3
    .create("svg")
    .attr("class", "elevation_chart")
    .attr("width", w)
    .attr("height", h)
    // .classed('responsive-container');
    .attr('class', 'responsive-container')
  svg
    .append("rect")
    .attr("width", w)
    .attr("height", h)
    // .attr("fill", "white") // fillfix
    // .attr("fill", "currentColor")
    // .attr('class', 'responsive-fill')
    
    .attr("opacity", 0.5);

  let lngLats = trkpts; //.map((pt) => [pt[1], pt[0]]);
  let elevation_path = [];
  let cummulative_length = 0;
  let R = 3;

  let distance_to_point_map = new Map();
  for (let i = R; i < trkpts.length - R; i++) {
    cummulative_length =
      cummulative_length + d3.geoDistance(lngLats[i - 1], lngLats[i]) * 3958.8;
    let elevation = d3.mean(trkpts.slice(i - R, i + R).map((pt) => pt.ele));
    elevation_path.push([cummulative_length, elevation]);
    distance_to_point_map.set(cummulative_length, lngLats[i]);
  }

  let path_length = elevation_path.slice(-1)[0][0];
  let elevations = trkpts.map((o) => o.ele);
  let min_elevation = d3.min(elevations);
  let max_elevation = d3.max(elevations);
  let elevation_pad = 500;

  let elevation_path2 = [[0, min_elevation - elevation_pad]]
    .concat(elevation_path)
    .concat([[path_length, min_elevation - elevation_pad]]);

  let x_scale = d3.scaleLinear().domain([0, path_length]).range([pad_left, w]);
  let y_scale = d3
    .scaleLinear()
    .domain([min_elevation - elevation_pad, max_elevation + elevation_pad])
    .range([h - pad_bottom, 0]);
  let pts_to_path = d3
    .line()
    .x((d) => x_scale(d[0]))
    .y((d) => y_scale(d[1]));

  svg
    .append("path")
    .attr("d", pts_to_path(elevation_path2))
    // .style("stroke", "black")
    .style("stroke-width", "0px")
    .style("stroke-linejoin", "round")
    .style("opacity", 0.7)
    // .style("fill", "#eee");
  svg
    .append("path")
    .attr("d", pts_to_path(elevation_path))
    // .style("stroke", "black")
    .style("stroke-width", "3px")
    .style("stroke-linejoin", "round")
    .style("fill", "none");
  svg
    .append("g")
    .attr("transform", `translate(0, ${h - pad_bottom})`)
    .call(d3.axisBottom(x_scale));
  svg
    .append("g")
    .attr("transform", `translate(${pad_left})`)
    .call(d3.axisLeft(y_scale));
  let position_marker = svg
    .append("g")
    .attr("class", "position_marker")
    .style("opacity", 0);
  position_marker
    .append("line")
    .attr("stroke-width", "1px")
    .attr("stroke", "black")
    .attr("y1", 0)
    .attr("y2", h)
    .attr("x1", w / 2)
    .attr("x2", w / 2);
  position_marker
    .append("circle")
    .attr("r", "5px")
    .attr("cx", w / 2)
    .attr("cy", h / 2)
    .attr("fill", "#0ff")
    .attr("stroke", "black");

  let lengths = elevation_path.map((pt) => pt[0]);
  svg
    .on("touchmove", (e) => e.preventDefault()) // prevent scrolling
    .on("pointerenter", function () {
      position_marker.style("opacity", 1);
      map.addSource("point", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: trkpts[20]
          }
        }
      });
      map.addLayer({
        id: "point",
        type: "circle",
        source: "point",
        paint: {
          "circle-radius": 6,
          "circle-color": "cyan"
          // "stroke-color": "black"
        }
      });
    })
    .on("pointermove", function (evt) {
      evt.preventDefault();
      let distance = x_scale.invert(d3.pointer(evt)[0]);
      let i = binarySearch(lengths, distance);
      let x = x_scale(distance);
      let elevation = elevations[i];
      let y = y_scale(elevation);
      position_marker.select("line").attr("x1", x).attr("x2", x);
      position_marker.select("circle").attr("cx", x).attr("cy", y);
      // global.gpx_path.getLayers()[1].setLatLng(trkpts[i]);
      map.getSource("point").setData({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: trkpts[i]
        }
      });
    })
    .on("pointerleave", function () {
      position_marker.style("opacity", 0);
      map.removeLayer("point");
      map.removeSource("point");
    });

  if (trkpts[0].time) {
    svg
      .append("text")
      .attr("x", 50)
      .attr("y", 20)
      .text(formatTime(trkpts[0].time));
  }
  svg
    .append("text")
    .attr("x", 50)
    .attr("y", 40)
    .text(`${d3.format("0.1f")(path_length)} miles`);

  d3.select("#elevation_chart_container")
    // .selectAll(".elevation_chart")
    .select('svg')
    .remove();
  d3.select("#elevation_chart_container")
    .append(() => svg.node());
}

// Given an *ordered* array arr and a value t, this finds the index
// of the laregest element of arr that is less than t.
// Used when we hover over the elevation chart to quickly find the
// corresponding point on the path.

function binarySearch(arr, t, bail = 100) {
  let cnt = 0;
  let m = 0;
  let n = arr.length;
  let a = arr[0];
  let b = arr[n - 1];
  if (t <= a) {
    return 0;
  } else if (t >= b) {
    return n - 1;
  } else {
    let k;
    while (n - m > 1 && cnt++ < bail) {
      k = Math.floor((m + n) / 2);
      let c = arr[k];
      if (t <= c) {
        b = c;
        n = k;
      } else {
        a = c;
        m = k;
      }
    }
    return k;
  }
}
