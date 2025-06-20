import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as topojson from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

export function process_data(raw_map_data, results) {
  const data_by_district = d3.rollup(results,
    function(a) {
      const sorted = d3.sort(a, o => -o.votes);
      const dem_result = sorted.find(o => o.party=="dem");
      let dem_total, dem_candidate, rep_total, rep_candidate
      if(dem_result) {
        dem_total = dem_result.votes;
        dem_candidate = dem_result.name;
      }
      else {
        dem_total = 0;
        dem_candidate = "None"
      }
      const rep_result = sorted.find(o => o.party=="rep");
      if(rep_result) {
        rep_total = rep_result.votes;
        rep_candidate = rep_result.name;
      }
      else {
        rep_total = 0;
        rep_candidate = "None"
      }
      return {
        district: sorted[0].district,
        winning_party: sorted[0].party,
        dem_total, rep_total, dem_candidate, rep_candidate
      }
    },
    o => o.chamber,
    o => o.district);

  const tallies = [];
  data_by_district.forEach(function(data, chamber) {
    const d = Array.from(data.values());
    const seats = d.length;
    const rep_votes = d3.sum(d, o => o.rep_total);
    const dem_votes = d3.sum(d, o => o.dem_total);
    const rep_seats = d.filter(o => o.winning_party == "rep").length;
    const dem_seats = d.filter(o => o.winning_party == "dem").length;
    tallies.push(
      {chamber, seats, rep_votes, dem_votes, rep_seats, dem_seats}
    );
  });

  const columns = [
    "Chamber","Seats","Rep votes","Dem votes","Rep seats","Dem seats"
  ];
  const keys = columns.map(s => s.replace(' ', '_').toLowerCase());
  const tally_totals = {chamber: "Total"};
  keys.forEach(function(k) {
    if(k != "chamber") {
      tally_totals[k] = d3.sum(tallies, o => o[k])
    }
  });
  tallies.push(tally_totals);

  const processed_map_data = Object.fromEntries(
    Object.keys(raw_map_data.objects)
    .map(key => [key,
      topojson.feature(
        raw_map_data,
        raw_map_data.objects[key])
    ])
  );

  [
    "NC House",
    "NC Senate",
    "US Congress"
  ].forEach(function(Chamber) {
    const chamber = Chamber.replace(" ", "_").toLowerCase();
    const features = processed_map_data[chamber].features;
    const district_data = data_by_district.get(Chamber)
    district_data.forEach(function(data, district_num) {
      const props = features.find(
        f => f.properties.DISTRICT == district_num
      ).properties;
      Object.assign(props, data);
      props.fill = props.winning_party == "dem" ? "#0571b0" : "#ca0020";
    })
  });

  return {processed_map_data, data_by_district, tallies}
}


// const votes_by_party = d3.groups(results,
//   o => o.party
// ).map(function(a) {
//   const o = {Candidates: a[1].length, Votes: d3.sum(a[1], o => o.votes)};
//   if(a[0] == "dem") {
//     o.Party = "Democratic"
//   }
//   else if(a[0] == "rep") {
//     o.Party = "Republican"
//   }
//   else if(a[0] == "lib") {
//     o.Party = "Libertarian";
//   }
//   else if(a[0] == "cst") {
//     o.Party = "Constitutional"
//   }
//   else if(a[0] == "gre") {
//     o.Party = "Green"
//   }
//   else if(a[0] == "wtp") {
//     o.Party = "We the People"
//   }
//   else if(a[0] == "una") {
//     o.Party = "Independent"
//   }
//   return o;
// });
