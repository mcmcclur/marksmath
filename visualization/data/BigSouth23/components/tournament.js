import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import lodash from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm'

const links = d3.csvParse(`year,expected_seeds,expected_preseeds
2023,1-2,
2023,1-4,1-2
2023,2-3,1-2
2023,1-8,1-4
2023,4-5,1-4,
2023,2-7,2-3
2023,3-6,2-3
2023,8-9,1-8
2023,7-10,2-7`);

const games = new Map([
  [
    "1-2",
    {
      top_team: "UNC Asheville",
      bot_team: "Campbell",
      top_score: 77,
      bot_score: 73,
      top_champion: true
    }
  ],
  [
    "2-3",
    { top_team: "Campbell", bot_team: "Radford", top_score: 72, bot_score: 71 }
  ],
  [
    "1-4",
    {
      top_team: "UNC Asheville",
      bot_team: "SC Upstate",
      top_score: 66,
      bot_score: 62
    }
  ],
  [
    "8-9",
    {
      top_team: "High Point",
      bot_team: "Charleston So",
      bot_score: 72,
      top_score: 70
    }
  ],
  [
    "1-8",
    {
      top_team: "UNC Asheville",
      bot_team: "Charleston So",
      top_score: 75,
      bot_score: 66
    }
  ],
  [
    "4-5",
    {
      top_team: "SC Upstate",
      bot_team: "Gardner-Webb",
      top_score: 77,
      bot_score: 76
    }
  ],
  [
    "7-10",
    {
      top_team: "Campbell",
      bot_team: "Presbyterian",
      top_score: 68,
      bot_score: 63
    }
  ],
  [
    "2-7",
    { top_team: "Longwood", bot_team: "Campbell", top_score: 68, bot_score: 81 }
  ],
  [
    "3-6",
    { top_team: "Radford", bot_team: "Winthrop", top_score: 78, bot_score: 69 }
  ]
]);

const data = [];
games.forEach(function (v, k) {
  let o = Object.assign(v, { seeds: k, year: 2023 });
  o = {
    year: o.year,
    seeds: o.seeds,
    top_team: o.top_team,
    top_score: o.top_score,
    bot_team: o.bot_team,
    bot_score: o.bot_score,
    top_chamption: o.top_champion,
    bot_chamption: o.bot_champion
  };
  data.push(o);
});


export function draw_tourney(width) {
  let w = d3.min([width, 1000]);
  let h = 0.625 * w;
  let margin = w / 10;
  let game_height = h / 12;
  let team_width = w / 5;
  const size = { w, h, margin, game_height, team_width };
  
  const root = d3.hierarchy(
    d3
      .stratify()
      .id((o) => o.expected_seeds)
      .parentId((o) => o.expected_preseeds)(links)
  );
  d3.tree().size([size.h, size.w])(root);
  
  const scale = d3
    .scaleLinear()
    .domain([0, size.w])
    .range([size.w - size.margin, size.margin]);

  let div = d3
    .create("div")
    .style("width", `${size.w}px`)
    .attr("height", `${size.h}px`)
    .style("position", "relative");

  let svg = div
    .append("svg")
    .attr("width", size.w)
    .attr("height", size.h)
    .style("overflow", "visible");
  let g = svg.append("g");

  let link_display = g.append("g").attr("id", "links");
  link_display
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", function (o) {
      let x1 = scale(o.source.y);
      let y1 = o.source.x;
      let x2 = scale(o.target.y);
      let y2 = o.target.x;

      let line = d3.line()([
        [x1, y1],
        [x1, y2],
        [x2, y2]
      ]);
      return line;
    })
    .attr("class", get_linked_team)
    .attr("fill", "none")
    .attr("stroke", "#222")
    .attr("stroke-width", 1.5);

  let game_containers = div
    .selectAll("div.game")
    .data(root.descendants())
    .enter()
    .append((d) => game_container(d, size, scale));

  div
    .selectAll(".team")
    .on("pointerenter", function () {
      let team = this.getAttribute("data-team");
      if (team) {
        game_containers
          .selectAll(`div.${team}`)
          .style("background-color", "#9999ee");
        link_display.selectAll("path." + team).attr("stroke-width", 3);
      }
    })
    .on("pointerleave", function () {
      let team = this.getAttribute("data-team");
      if (team) {
        game_containers
          .selectAll(`div.${team}`)
          .style("background-color", null);
        link_display.selectAll("path." + team).attr("stroke-width", 1.5);
      }
    });

  return div.node();

  function get_linked_team(link) {
    let teams = [];
    let source_links = link.source.data;
    let source_data = games.get(link.source.data.data.expected_seeds);
    let target_data = games.get(link.target.data.data.expected_seeds);

    let link_team;
    if (source_data && target_data) {
      let source_teams = [];
      if (source_data.top_team) {
        source_teams.push(source_data.top_team);
      }
      if (source_data.bot_team) {
        source_teams.push(source_data.bot_team);
      }
      let target_teams = [];
      if (target_data.top_team) {
        target_teams.push(target_data.top_team);
      }
      if (target_data.bot_team) {
        target_teams.push(target_data.bot_team);
      }
      link_team = lodash.intersection(source_teams, target_teams);
    }

    if (link_team && link_team.length == 1) {
      return link_team[0].replace(/ /g, "_");
    }
  }
}



function game_container(game_node, size, scale) {
  let div = d3
    .create("div")
    .style("width", size.team_width + "px")
    .style("height", size.game_height + "px")
    .style("left", scale(game_node.y) - size.team_width / 2 + "px")
    .style("top", game_node.x - size.game_height / 2 + "px")
    .style("border", "solid 0.5px black")
    .style("position", "absolute");

  let game_id = game_node.data.id;
  let game_data = games.get(game_id);
  let top_team, bot_team, top_score, bot_score;
  if (game_data) {
    top_team = game_data.top_team;
    bot_team = game_data.bot_team;
    top_score = game_data.top_score;
    bot_score = game_data.bot_score;
  }

  let top_data = { team: top_team, score: top_score };
  if (game_data && game_data.top_champion) {
    top_data.champion = true;
  }
  let bot_data = { team: bot_team, score: bot_score };
  if (game_data && game_data.bot_champion) {
    bot_data.champion = true;
  }
  if (game_id && !game_node.children) {
    let seeds = game_id.split("-");
    top_data.seed = seeds[0];
    bot_data.seed = seeds[1];
  } else if (game_id && game_node.children && game_node.children.length == 1) {
    top_data.seed = game_id.split("-")[0];
  }
  div.append(() => team_container("top", size, top_data));
  div.append(() => team_container("bot", size, bot_data));


  return div.node();
}

function team_container(tb, size, opts = {}) {
  let { team, score, seed, champion } = opts;
  let div = d3.create("div")
    .style('color', 'black')
    .style('height', champion ? `${1.4*size.game_height / 2}px` : `${size.game_height / 2}px`)
    .style('line-height', champion ? `${1.4*size.game_height / 2}px` :`${size.game_height / 2}px`)
    .attr("class", function (d) {
      let label = "team " + tb + "_team";
      if (team) {
        label = label + " " + team.replace(/ /g, "_");
        if (champion) {
          label = label + " " + "champion";
        }
      }
      return label;
    });
  if (team) {
    div.attr("data-team", team.replace(/ /g, "_"));
  }

  // Add name and score
  if (seed) {
    let seed_span = div
      .append("span")
      .attr("class", "seed")
      .text(seed + " ");
  }
  if (team) {
    div.append("span").text(team);
  }
  if (score) {
    div.append("span").attr("class", "score").text(score);
  }

  return div.node();
}
