import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import maplibregl from "https://esm.sh/maplibre-gl@4.7.0";
// import * as topojson from "https://cdn.jsdelivr.net/npm/topojson@latest/dist/topojson.js";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import {point_to_districts} from './point_to_districts.js';

export function make_map(processed_map_data) {
  const boundary = processed_map_data.boundary
  const bounds = get_bounds(boundary);

  const map = new maplibregl.Map({
      container: 'map_container',
      style: `https://tiles.openfreemap.org/styles/positron`,
      bounds: bounds
  });

  map.addControl(new maplibregl.NavigationControl(
    {showCompass: false})
  );

  map.on("load", function () {
    map.addSource("boundary", {
      type: "geojson",
      data: boundary
    });
    map.addLayer({
      id: "boundary",
      type: "line",
      source: "boundary",
      paint: {
        "line-width": 3
      }
    });
    add_path("us_congress");
  });

  map.on("mouseenter", "district-fills", function() {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on("click", "district-fills", function(e) {
    clear({markers: false});
    const popup = new maplibregl.Popup(e)
      .setLngLat(e.lngLat)
      .setHTML(make_popup_html(e.lngLat.lat, e.lngLat.lng))
      .setMaxWidth("500px")
      .addTo(map);
    map.popup = popup;
    map.popup_up = true;
  });
  map.on('mouseout', 'district-fills', () => {
      map.getCanvas().style.cursor = '';
  });


  map.add_path = add_path;
  map.add_nominatim_marker = add_nominatim_marker;
  map.popup_up = false;
  map.marker_down = false;
  map.clear = clear;
  map.redo_popup = redo_popup;


  // function get_popup_info() {
  //   if(map.popup_up) {
  //     console.log(map.popup._lngLat)
  //   }
  // }
  // map.get_popup_info = get_popup_info;


  return map;

  function clear(opts = {}) {
    let {markers = true, popups = true} = opts;
    if (markers && map.marker_down) {
      map.marker.remove();
      map.marker_down = false;
    }
    if(popups && map.popup_up) {
      map.popup.remove();
      map.popup_up = false;
    }
  }


  function add_nominatim_marker(nominatim_json) {
    if(map.popup_up) {
      map.popup.remove();
      map.popup_up = false;
    }
    if(map.marker_down) {
      map.marker.remove();
      map.marker_down = false;
    }
    let lon = nominatim_json.lon;
    let lat = nominatim_json.lat;


    const marker = new maplibregl
      .Marker({
        focusAfterOpen:false
      })
      .setLngLat([
        nominatim_json.lon,
        nominatim_json.lat
      ])
      .addTo(map);
    map.marker = marker;
    map.marker_down = true;

    let [lat_min,lat_max,lon_min,lon_max] =
      nominatim_json.boundingbox;
    map.fitBounds(
      [[lon_min,lat_min],[lon_max,lat_max]],
      {padding: 200}
    );

    try {
      map.fire('click', {
        offset: 30,
        lngLat: new maplibregl.LngLat(
          nominatim_json.lon,
          nominatim_json.lat
        )
      });
    } catch(TypeError) {
      // Expect an original event not defined error.
      "pass"
    }
  }

  function redo_popup(ChamberIn) {
    if(map.popup_up) {
      clear({markers: false})
      // map.popup.remove();
      const lngLat = map.popup._lngLat;
      const offset= map.marker_down ? 30 : 0;
      const popup = new maplibregl.Popup({offset})
        .setLngLat(lngLat)
        .setHTML(make_popup_html(
          lngLat.lat,
          lngLat.lng,
          ChamberIn
        ))
        .setMaxWidth("500px")
        .on('close', function() {
          map.popup_up = false;
        })
        .addTo(map);
      map.popup = popup;
      map.popup_up = true;
    }
  }

  function make_popup_html(lat,lon, ChamberIn) {
    let chamber_in = map.chamber;
    if(ChamberIn) {
      chamber_in = ChamberIn
        .replace(" ", "_")
        .toLowerCase()
    }
    let districts = point_to_districts(
      [lon,lat],
      processed_map_data
    );


    let popup_html = d3.create('div');
    let table = popup_html.append('table');
    let header_row = table.append('tr');
    [
      "Chamber",
      "District",
      "Winner",
      // "Votes",
      "Loser",
      // "Votes"
    ].forEach(
      function(s) {
        header_row.append('th').text(s)
      }
    );
    // Chamber: "US Congress", "NC Senate", "NC House"
    // chamber: us_congress, nc_senate, nc_house
    ["US Congress", "NC Senate", "NC House"].forEach(
      function(Chamber) {
        const chamber = Chamber
          .replace(" ", "_")
          .toLowerCase();
        const district_data = districts
          .find(o => o.properties.chamber == chamber).properties;
        const district = district_data.DISTRICT;
        const row = table.append('tr');
        if(chamber == chamber_in) {
          row.style('background-color', 'lightgray')
        }
        row.append('td').text(Chamber);
        row.append('td')
          .style('text-align', 'center')
          .text(district);
        let win_display, lose_display;
        if(district_data.winning_party == "dem") {
          win_display =
            district_data.dem_candidate + " (D)";
          // win_votes =
          //   district_data.dem_total
          lose_display =
            district_data.rep_candidate + " (R)";
          // lose_votes =
          //   district_data.rep_total;
        }
        else {
          win_display =
            district_data.rep_candidate + " (R)";
          // win_votes =
          //   district_data.rep_total;
          lose_display =
            district_data.dem_candidate + " (D)";
          // lose_votes =
          //   district_data.dem_total
        }
        row.append('td').text(win_display);
        // row.append('td').text(win_votes);
        row.append('td').text(lose_display);
        // row.append('td').text(lose_votes);
      }
    );
    return popup_html.html();
  }

  function add_path(chamber) {
    map.chamber = chamber;
    const geojson = processed_map_data[chamber]
    if (map.getLayer("district-fills")) {
      map.removeLayer("district-fills");
    }
    if (map.getLayer("district-boundaries")) {
      map.removeLayer("district-boundaries");
    }
    if (map.getSource("districts")) {
      map.removeSource("districts");
    }
    map.addSource("districts", {
      type: "geojson",
      data: geojson
    });
    map.addLayer({
      id: "district-boundaries",
      type: "line",
      source: "districts",
      layout: {
        "line-join": "round",
        "line-cap": "round"
      },
      paint: {
        "line-color": '#000',
        "line-width": 1
      }
    });
    map.addLayer({
      id: "district-fills",
      type: "fill",
      source: "districts",
      paint: {
        "fill-color": ["get", "fill"],
        "fill-opacity": 0.3
      }
    });
  }
}


function get_bounds(boundary) {
  let pts = boundary.features[0].geometry.coordinates.flat(2);
  let [xmin, xmax] = d3.extent(pts.map((a) => a[0]));
  let [ymin, ymax] = d3.extent(pts.map((a) => a[1]));
  let xrange = xmax - xmin;
  xmin = xmin - 0.05 * xrange;
  xmax = xmax + 0.05 * xrange;
  let yrange = ymax - ymin;
  ymin = ymin - 0.05 * yrange;
  ymax = ymax + 0.05 * yrange;
  return [
    [xmin, ymin],
    [xmax, ymax]
  ];
}
