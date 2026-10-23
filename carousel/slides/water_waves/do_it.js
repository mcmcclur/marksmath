// Carousel copy of the water-wave model; the original class demo is unchanged.
import {select, range, scaleLinear, timer, format, line} from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function do_it(div, width, state) {
  const container = select(div);
  const svg = container.select('svg');
  const beta = 2;
  const xmin = -10, xmax = 10;
  // Extra particles and the water polygon extend beyond every submerged edge.
  const margin = 3;
  const columns = range(xmin - margin, xmax + margin + 1);
  let A = 0.5, alpha = 0.5, time = 0;
  let grid, bottom, xScale, yScale, path, circles;
  const surface = svg.append('path').attr('fill', 'var(--water-fill)')
    .attr('stroke', 'var(--water-outline)').attr('stroke-width', 2);
  const particles = svg.append('g');

  function p(x0, y0) {
    const radius = A * Math.exp(alpha * y0);
    const phase = alpha * x0 - beta * time / 1000;
    return [x0 + radius * Math.cos(phase), y0 + radius * Math.sin(phase)];
  }
  function draw() {
    const outline = columns.map(x => p(x, 0));
    outline.push([xmax + margin, bottom], [xmin - margin, bottom]);
    surface.attr('d', path(outline));
    circles.attr('cx', d => xScale(p(...d)[0]))
      .attr('cy', d => yScale(p(...d)[1]));
  }
  function resize() {
    const rect = svg.node().getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const height = width * rect.height / rect.width;
    // Equal horizontal/vertical scales preserve circular particle motion.
    const ymax = 3.5;
    const ymin = ymax - (xmax - xmin) * height / width;
    bottom = Math.floor(ymin) - margin;
    svg.attr('viewBox', `0 0 ${width} ${height}`);
    xScale = scaleLinear().domain([xmin, xmax]).range([0, width]);
    yScale = scaleLinear().domain([ymin, ymax]).range([height, 0]);
    path = line().x(d => xScale(d[0])).y(d => yScale(d[1]));
    grid = range(bottom, 1).flatMap(y => columns.map(x => [x, y]));
    circles = particles.selectAll('circle').data(grid, d => d.join(',')).join('circle')
      .attr('class', d => d[0] === 0 && (d[1] === 0 || d[1] === -3) ? 'highlight' : 'water')
      .attr('r', d => d[0] === 0 && (d[1] === 0 || d[1] === -3) ? 6 : 3)
      .attr('fill', d => d[0] === 0 && (d[1] === 0 || d[1] === -3) ? 'yellow' : 'var(--water-particle)')
      .attr('stroke', 'var(--water-particle-stroke)').attr('stroke-width', 1);
    draw();
  }
  for (const [id, initial, set] of [
    ['A', A, value => { A = value; }],
    ['alpha', alpha, value => { alpha = value; }]
  ]) {
    container.select(`#${id}`).property('value', initial).on('input', function () {
      set(+this.value);
      container.select(`#${id}_value`).text(format('.2f')(+this.value));
    });
    container.select(`#${id}_value`).text(format('.2f')(initial));
  }
  const observer = new ResizeObserver(resize);
  observer.observe(svg.node());
  resize();
  let previous = 0, tour = 0, wasAuto = false;
  const inputs = ['A', 'alpha'].map(id => div.querySelector(`#${id}`));
  let anchors = inputs.map(input => +input.value);
  const clock = timer(elapsed => {
    const dt = Math.min(100, elapsed - previous); previous = elapsed;
    if (!state.active || !circles) return;
    time += dt;
    if (state.auto) {
      if (!wasAuto) { anchors = inputs.map(input => +input.value); tour = 0; }
      tour += dt / 1000;
      inputs.forEach((input, i) => {
        input.value = Math.max(+input.min, Math.min(+input.max,
          anchors[i] + [0.3, 0.25][i] * Math.sin(tour / (3 + i))));
        input.dispatchEvent(new Event('input'));
      });
    }
    wasAuto = state.auto;
    draw();
  });
  window.addEventListener('pagehide', () => { clock.stop(); observer.disconnect(); }, {once: true});
}
