// Follow the upper cardioid, detour around the period-2 bulb at -1,
// and return along the lower cardioid. Short cubic joins round the neck.
function cardioid(theta) {
  return [-0.25 + 1.03 * (0.25 + 0.5*Math.cos(theta) - 0.25*Math.cos(2*theta)),
    1.03 * (0.5*Math.sin(theta) - 0.25*Math.sin(2*theta))];
}
const radius = 0.265; // The actual period-2 bulb has radius 1/4.
const neck = 3, bulbAngle = 0.55;
const circle = angle => [-1 + radius*Math.cos(angle), radius*Math.sin(angle)];
const start = cardioid(neck), end = circle(bulbAngle);
function handle(point, direction, distance) {
  const length = Math.hypot(...direction);
  return point.map((x, i) => x + distance*direction[i]/length);
}
const firstHandle = handle(start,
  [-Math.sin(neck)+Math.sin(2*neck), Math.cos(neck)-Math.cos(2*neck)], 0.025);
const lastHandle = handle(end, [-Math.sin(bulbAngle), Math.cos(bulbAngle)], -0.025);
function join(t) {
  return start.map((_, i) => (1-t)**3*start[i] + 3*(1-t)**2*t*firstHandle[i]
    + 3*(1-t)*t*t*lastHandle[i] + t**3*end[i]);
}
const samples = [];
function segment(count, point) {
  for (let i = 0; i < count; i++) samples.push(point(i/count));
}
segment(600, t => cardioid(t*neck));
segment(60, join);
segment(500, t => circle(bulbAngle + t*(2*Math.PI-2*bulbAngle)));
segment(60, t => { const p = join(1-t); return [p[0], -p[1]]; });
segment(600, t => cardioid(2*Math.PI-neck+t*neck));
samples.push(cardioid(0));
const distances = [0];
for (let i = 1; i < samples.length; i++) {
  distances.push(distances[i-1] + Math.hypot(...samples[i].map((x,j) => x-samples[i-1][j])));
}
const length = distances.at(-1);
// Arc-length lookup maintains steady motion through the bulb and both joins.
export function tourPath(phase) {
  const distance = ((phase/(2*Math.PI))%1+1)%1*length;
  let lo = 0, hi = distances.length-1;
  while (hi-lo > 1) {
    const mid = (lo+hi)>>1;
    if (distances[mid] <= distance) lo = mid; else hi = mid;
  }
  const t = (distance-distances[lo])/(distances[hi]-distances[lo]);
  return samples[lo].map((x,i) => x*(1-t)+samples[hi][i]*t);
}
