import {
  csvParse,
  autoType,
  sum,
  arc,
  ribbon as d3Ribbon,
  scaleOrdinal,
  scaleLinear,
  range,
  chord,
  create,
  rgb,
  select,
  sort,
  timeFormat
} from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = {
  csvParse,
  autoType,
  sum,
  arc,
  scaleOrdinal,
  scaleLinear,
  range,
  chord,
  create,
  rgb,
  select,
  sort,
  timeFormat
}
d3.ribbon = d3Ribbon;

const games = await fetch('components/big_south_games.csv')
  .then(async function(r) {
    const games = d3.csvParse(await r.text(), d3.autoType);
    return games
  });


const teams = uniq(games.map((o) => [o.name1, o.name2]).flat())
  .sort()
  .map(function (team) {
    if (team == "Campbell") {
      return {
        team,
        colors: ["#EA7125", "#1E252B"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/8/84/Campbell_Fighting_Camels_logo.svg"
      };
    } else if (team == "Charleston_So") {
      return {
        team,
        colors: ["#A8996E", "#002855"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/8/86/Charleston_Southern_Buccaneers_logo.svg"
      };
    } else if (team == "Gardner_Webb") {
      return {
        team,
        colors: ["#BB0000", "#141414"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/a/a3/Gardner%E2%80%93Webb_Runnin%27_Bulldogs_logo.svg"
      };
    } else if (team == "High_Point") {
      return {
        team,
        colors: ["#330072", "#818183"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/2/2c/High_Point_Panthers_logo.svg"
      };
    } else if (team == "Longwood") {
      return {
        team,
        colors: ["#041e42", "#9ea2a2"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/5/5f/Longwood_Lancers_logo.svg"
      };
    } else if (team == "Presbyterian") {
      return {
        team,
        colors: ["#0060A9", "#9D2235"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/9/93/Presbyterian_College_logo.svg"
      };
    } else if (team == "Radford") {
      return {
        team,
        colors: ["#c2011b", "#d1d3d4"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/6/6d/Radford_Highlanders_logo.png"
      };
    } else if (team == "SC_Upstate") {
      return {
        team,
        colors: ["#00703c", "#000000"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/8/8e/USC_Upstate_Spartans_logo.svg"
      };
    } else if (team == "UNC_Asheville") {
      return {
        team,
        colors: ["#003DA5", "#FFFFFF"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/9/93/UNC_Asheville_Bulldogs_logo.svg"
      };
    } else if (team == "Winthrop") {
      return {
        team,
        colors: ["#660000", "#F0B323"],
        logo_url:
          "https://upload.wikimedia.org/wikipedia/en/d/df/Winthrop_Eagles_logo.svg"
      };
    }
  });


const M = [];
for (let i = 0; i < teams.length; i++) {
  let row = [];
  for (let j = 0; j < teams.length; j++) {
    if (i != j) {
      let games_ij = games.filter((o) => o.idx1 == i && o.idx2 == j);
      let wins_ij = games_ij.filter((o) => o.score1 > o.score2).length;
      let points_i_over_j = d3.sum(games_ij, (o) => o.score1);
      let points_j_under_i = d3.sum(games_ij, (o) => o.score2);
      let games_ji = games.filter((o) => o.idx1 == j && o.idx2 == i);
      let points_j_over_i = d3.sum(games_ji, (o) => o.score1);
      let points_i_under_j = d3.sum(games_ji, (o) => o.score2);
      let points_i_against_j = points_i_over_j + points_i_under_j;
      let total_points_ij =
        +points_i_over_j +
        points_j_under_i +
        points_j_over_i +
        points_i_against_j;
      row.push(wins_ij + points_i_against_j / total_points_ij);
    } else {
      row.push(0);
    }
  }
  M.push(row);
}
 
const size = 700;
const arc_width = 20;
const r = size / 2 - arc_width;
const r_in = r - arc_width;
const r_out = r + arc_width;
const arc1 = d3.arc().innerRadius(r_in).outerRadius(r);
const arc2 = d3.arc().innerRadius(r).outerRadius(r_out);
const ribbon = d3.ribbon().radius(r_in);
const scale = d3
  .scaleLinear()
  .domain([-1, 1])
  .range([-size / 2, size / 2]);
const team_colors = d3
  .scaleOrdinal()
  .domain(d3.range(14))
  .range(teams.map((d) => d.colors));
const chords = d3.chord().padAngle(0.05)(M);

const layout = { chords, arc1, arc2, ribbon, scale, size, team_colors };

 
export function chord_diagram() {
  let { chords, size, arc1, arc2, ribbon, team_colors, scale } = layout;
  let div = d3
    .create("div")
    .attr('class', 'chord-container')
    .style("position", "relative")
    .on("touchmove", (evt) => evt.preventDefault());

  let svg = div
    .append("svg")
    .style("max-width", `${size}px`)
    .style("overflow", "visible")
    .attr("viewBox", [-0.5 * size, -0.5 * size, 1 * size, 1 * size]);
  let info = div
    .append("div")
    .style("width", "200px")
    .style("background", "rgba(255,255,255,0)")
    .style("height", "100px")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px")
    .style("pointer-events", "none");

  let arcs_and_chords = svg.append("g").attr("transform", "rotate(65)");
  let arcs = arcs_and_chords
    .append("g")
    .selectAll("g")
    .data(chords.groups)
    .join("g");
  arcs
    .append("path")
    .attr("fill", (d) => team_colors(d.index)[0])
    .attr("stroke", (d) => d3.rgb(team_colors(d.index)[0]).darker())
    .attr("d", arc1);
  arcs
    .append("path")
    .attr("fill", (d) => team_colors(d.index)[1])
    .attr("stroke", (d) => d3.rgb(team_colors(d.index)[1]).darker())
    .attr("d", arc2);

  let ribbons = arcs_and_chords
    .append("g")
    .attr("opacity", 0.5)
    .selectAll("path")
    .data(chords)
    .join("path")
    .attr("d", ribbon)
    .attr("class", function (d) {
      let team1 = teams[d.source.index].team;
      let team2 = teams[d.target.index].team;
      return `chord ${team1} ${team2}`;
    })

    // Note: It certainly looks here as if we are artifically setting
    // ribbons incident with UNCA to UNCA's color.  In reality, this
    // changes the color of just one ribbon, namely UNCA <-> SC_Upstate,
    // which seems fair since both teams scored the same number of
    // points over two games.
    .attr("fill", (d) =>
      d.target.index == 8 ? team_colors(8)[0] : team_colors(d.source.index)[0]
    )
    .attr("stroke", (d) =>
      d.target.index == 8
        ? d3.rgb(team_colors(8)[0]).darker(4)
        : d3.rgb(team_colors(d.source.index)[0]).darker(4)
    )
    // .attr("fill", (d) => team_colors(d.source.index)[0])
    // .attr("stroke", (d) => d3.rgb(team_colors(d.source.index)[0]).darker(4))
    .attr("fill-opacity", 0.5)
    .on("pointerenter", function () {
      svg.selectAll(".chord").attr("fill-opacity", 0.1);
      d3.select(this).attr("fill-opacity", 1).raise();
      let [name1, name2] = this.getAttribute("class").split(" ").slice(1);
      info.html(game_info(name1, name2).outerHTML);
    })
    .on("pointerleave", function () {
      svg.selectAll(".chord").attr("fill-opacity", 0.5);
      info.html("");
    });

  let logos = svg
    .append("g")
    .selectAll("image")
    .data(chords.groups)
    .join("image")
    .attr("x", function (d) {
      let theta = (d.startAngle + d.endAngle) / 2 + (65 * Math.PI) / 180;
      return 0.97 * scale(Math.cos(theta - Math.PI / 2));
    })
    .attr("y", function (d) {
      let theta = (d.startAngle + d.endAngle) / 2 + (65 * Math.PI) / 180;
      return 0.97 * scale(Math.sin(theta - Math.PI / 2));
    })
    .attr("width", function (d) {
      if (teams[d.index].logo_size) {
        return teams[d.index].logo_size;
      } else {
        return 40;
      }
    })
    .attr("height", function (d) {
      if (teams[d.index].logo_size) {
        return teams[d.index].logo_size;
      } else {
        return 40;
      }
    })
    .attr("transform", function (d) {
      if (teams[d.index].team == "SC_Upstate") {
        return "translate(-18,-18)";
      } else if (teams[d.index].team == "Radford") {
        return "translate(-15,-15)";
      } else if (teams[d.index].team == "Winthrop") {
        return "translate(-15,-15)";
      } else {
        return "translate(-15,-15)";
      }
    })
    .attr("href", (d) => teams[d.index].logo_url)
    .on("pointerenter", function (e, d) {
      let name = teams[d.index].team;
      let this_class = "." + name;
      svg.selectAll(".chord").attr("fill-opacity", 0.1);
      svg.selectAll(this_class).attr("fill-opacity", 1).raise();
      info.html(team_info(name).outerHTML);
    })
    .on("pointerleave", function () {
      svg.selectAll(".chord").attr("fill-opacity", 0.5);
      info.html("");
    });

  return div.node();
}


function team_info(name) {
  let wins = games.filter((o) => o.name1 == name);
  let losses = games.filter((o) => o.name2 == name);
  let points = d3.sum(wins, (o) => o.score1) + d3.sum(losses, (o) => o.score2);
  let points_against =
    d3.sum(wins, (o) => o.score2) + d3.sum(losses, (o) => o.score1);

  let div = d3
    .create("div")
    .style("background", "rgba(255,255,255,0.5)")
    .style("border", "solid 1px lightslategray")
    .style("border-radius", "4px")
    .style("font-size", "0.8em");
  div
    .append("div")
    .style("text-decoration", "underline")
    .style("font-weight", "bold")
    .text(name.replace(/_/g, " "));
  let ul = div.append("ul").style("margin-top", "0px");
  ul.append("li").text(`Record: ${wins.length}-${losses.length}`);
  ul.append("li").text(
    `Points: ${d3.sum(wins, (o) => o.score1) + d3.sum(losses, (o) => o.score2)}`
  );
  ul.append("li").text(
    `Points against: ${
      d3.sum(wins, (o) => o.score2) + d3.sum(losses, (o) => o.score1)
    }`
  );

  return div.node();
}

function game_info(name1, name2) {
  let div = d3
    .create("div")
    .style("background", "rgba(255,255,255,0.5)")
    .style("border", "solid 1px lightslategray")
    .style("border-radius", "4px")
    .style("width", "300px");
  let games_1_over_2 = games
    .filter((o) => o.name1 == name1 && o.name2 == name2)
    .map((o) => Object.assign({}, o));
  games_1_over_2.forEach(function (g) {
    g.first_team = name1;
    g.first_score = g.score1;
    g.second_team = name2;
    g.second_score = g.score2;
  });
  let games_2_over_1 = games
    .filter((o) => o.name1 == name2 && o.name2 == name1)
    .map((o) => Object.assign({}, o));
  games_2_over_1.forEach(function (g) {
    g.first_team = name1;
    g.first_score = g.score2;
    g.second_team = name2;
    g.second_score = g.score1;
  });

  let these_games = d3.sort(
    games_1_over_2.concat(games_2_over_1),
    (o) => o.date
  );
  let table = div.append("table")
    .style("background", "rgba(255,255,255,0)")
    // .style("border", "solid 1px lightslategray")
  let header = table.append("tr");
  header.append("th"); // .style("width", "2000px");
  header.append("th").style('border-right', 'black').text(name1.replace(/_/g, " "));
  header.append("th").text(name2.replace(/_/g, " "));
  these_games.forEach(function (game) {
    let row = table.append("tr");
    row
      .append("td")
      // .style("width", "2000px")
      .text(d3.timeFormat("%b %d, '%y")(game.date));
    row.append("td").style("text-align", "center").text(game.first_score);
    row.append("td").style("text-align", "center").text(game.second_score);
  });

  return div.node();
}

function uniq(array) {
  return Array.from(new Set(array));
}
