////////////////////
// The main function

export function generate_season(seed) {
  const rng = mulberry32(seed);
  const teams = randomTeamNames(cities, teamNames, 4, rng);
  const strengths = randomStrengths(teams, rng)
  const params = defaultParams()

  const results = simulateDoubleRoundRobin(teams, strengths, params, rng).map( o => ({
    team1: o.team1, score1: o.score1, team2: o.team2, score2: o.score2
  }));
  return results;
}



/////////////
// Simulation

/**
 * @typedef {Object} Params
 * @property {number} k        Points per 1-unit strength gap (margin slope)
 * @property {number} sigma    Global SD of margin (your main knob)
 * @property {number} gamma0   Baseline total points
 * @property {number} gamma1   Total points slope vs (s1 + s2)
 * @property {number} tau      SD of total points
 * @property {number} homeAdv  Home-court advantage in points
 */
function defaultParams() {
  return {
    k: 8.0,
    sigma: 15.0,
    gamma0: 140.0,
    gamma1: 5.0,
    tau: 10.0,
    homeAdv: 3.5
  };
}

// --- Core simulation ---------------------------------------------------

/**
 * Simulate a single game between team1 and team2.
 * @param {string} team1
 * @param {string} team2
 * @param {Object<string, number>} strengths  map team -> strength s > 0
 * @param {Params} params
 * @param {string|null} home  team id for home team (team1/team2/null)
 * @param {() => number} rng  PRNG returning uniform [0,1)
 */
function simulateGame(team1, team2, strengths, params, home, rng) {
  const s1 = strengths[team1];
  const s2 = strengths[team2];

  let homeSign = 0;
  if (home === team1) homeSign = 1;
  else if (home === team2) homeSign = -1;

  // Margin ~ Normal(k*(s1-s2) + homeAdv*homeSign, sigma^2)
  const muMargin = params.k * (s1 - s2) + params.homeAdv * homeSign;
  const margin = rnorm(muMargin, params.sigma, rng);

  // Total ~ Normal(gamma0 + gamma1*(s1+s2), tau^2)
  const muTotal = params.gamma0 + params.gamma1 * (s1 + s2);
  const total = rnorm(muTotal, params.tau, rng);

  // Convert to individual scores
  const sc1 = Math.max(0, (total + margin) / 2);
  const sc2 = Math.max(0, (total - margin) / 2);

  let score1 = Math.round(sc1);
  let score2 = Math.round(sc2);

  // Avoid ties; nudge toward the latent margin
  if (score1 === score2) {
    if (margin >= 0) score1 += 1;
    else score2 += 1;
  }

  return {
    team1,
    team2,
    score1,
    score2,
    home: home ?? null,
    latent: { margin, total, muMargin, muTotal }
  };
}

/**
 * Double round robin: each unordered pair plays twice (home/away).
 * @param {string[]} teams
 * @param {Object<string, number>} strengths
 * @param {Params} params
 * @param {() => number} rng
 * @returns {Array<Object>}
 */
function simulateDoubleRoundRobin(teams, strengths, params, rng) {
  const results = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const t1 = teams[i],
        t2 = teams[j];
      results.push(simulateGame(t1, t2, strengths, params, t1, rng)); // t1 home
      // results.push(simulateGame(t1, t2, strengths, params, t2, rng)); // t2 home
    }
  }
  return results;
}




////////////////////////////////////
// Random seed and normal generators

function rnorm(mean, sd, rng) {
  return mean + sd * randn(rng);
}

// Mulberry32 PRNG (fast, decent for sims)
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Box–Muller transform using provided RNG
function randn(rng) {
  // return a single N(0,1)
  let u = 0,
    v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}



////////////////////////////////
// Generate teams with strengths

function randomTeamNames(cities, teamNames, n, rng) {
  const names = [];
  for (let i = 0; i < n; i++) {
    const city = cities[Math.floor(rng() * cities.length)];
    const mascot = teamNames[Math.floor(rng() * teamNames.length)];
    names.push(`${city} ${mascot}`);
  }
  return names;
}
function randomStrengths(teams, rng, min = 0.8, max = 1.2) {
  const strengths = {};
  for (const t of teams) {
    strengths[t] = min + (max - min) * rng();
  }
  return strengths;
}

const cities = [
  "Albany", "Amarillo", "Anchorage", "Asheville", "Austin",
  "Baton Rouge", "Bend", "Birmingham", "Boise", "Boulder",
  "Buffalo", "Charleston", "Chattanooga", "Cheyenne", "Cleveland",
  "Columbia", "Columbus", "Dayton", "Duluth", "Eugene",
  "Fargo", "Flagstaff", "Fort Collins", "Gainesville", "Grand Rapids",
  "Green Bay", "Harrisburg", "Helena", "Huntsville", "Ithaca",
  "Jackson", "Knoxville", "Lafayette", "Lancaster", "Lincoln",
  "Little Rock", "Madison", "Mobile", "Montgomery", "Nashville",
  "Omaha", "Pensacola", "Providence", "Raleigh", "Reno",
  "Roanoke", "Santa Fe", "Savannah", "Spokane", "Toledo",
  "Tulsa", "Wichita", "Wilmington", "Yakima", "Youngstown"
];

const teamNames = [
  "Armadillos", "Badgers", "Barracudas", "Bears", "Bobcats",
  "Broncos", "Buccaneers", "Cardinals", "Chargers", "Comets",
  "Coyotes", "Crusaders", "Cyclones", "Dragons", "Eagles",
  "Falcons", "Foxes", "Gators", "Giants", "Grizzlies",
  "Hawks", "Hornets", "Hurricanes", "Jaguars", "Kings",
  "Knights", "Lions", "Locomotives", "Marlins", "Mustangs",
  "Otters", "Owls", "Panthers", "Penguins", "Pioneers",
  "Raccoons", "Raiders", "Ravens", "Rebels", "Rockets",
  "Sharks", "Spartans", "Stallions", "Storm", "Tigers",
  "Titans", "Tornadoes", "Turtles", "Vikings", "Wolves",
  "Wombats"
];

