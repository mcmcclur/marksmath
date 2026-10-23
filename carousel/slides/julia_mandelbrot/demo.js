import {onThemeChange} from '../theme.js';
import {state, ready, reportError, onVisit, complete} from '../slide-state.js';
import {compute_orbit, ij_to_xy, xy_to_ij} from './math.js';
import {renderer} from './renderer.js';

import {tourPath} from './tour-path.js';

try {
  const mandelBounds = [-2, 0.6, -1.3, 1.3];
  const juliaBounds = [-2, 2, -2, 2];
  const mandel = renderer(document.querySelector('#mandelbrot'), mandelBounds, true);
  const julia = renderer(document.querySelector('#julia'), juliaBounds);
  const parameter = document.querySelector('#parameter');
  const orbit = document.querySelector('#orbit');
  const marker = document.querySelector('#marker');
  const value = document.querySelector('#c-value');
  const orbitPath = document.querySelector('#orbit-path');
  const orbitStart = document.querySelector('#orbit-start');
  let theta = 0.5, c = tourPath(theta), dirty = true, wasAuto = false;
  let blendFrom = c, blend = 1, orbitPoint = null;
  function pixel(z, bounds) { return xy_to_ij(z, ...bounds, 1001); }
  function path(points, bounds) {
    return points.map((z, i) => `${i ? 'L' : 'M'}${pixel(z, bounds).join(',')}`).join(' ');
  }
  function drawOrbit() {
    if (!orbitPoint) return;
    orbitPath.setAttribute('d', path(compute_orbit(c, orbitPoint), juliaBounds));
    const [x,y] = pixel(orbitPoint, juliaBounds);
    orbitStart.setAttribute('cx', x); orbitStart.setAttribute('cy', y);
    orbitStart.setAttribute('visibility', 'visible');
  }
  function draw() {
    julia(c);
    const [x,y] = pixel(c, mandelBounds);
    marker.setAttribute('cx', x); marker.setAttribute('cy', y);
    value.value = `c = ${c[0].toFixed(4)} ${c[1] < 0 ? '−' : '+'} ${Math.abs(c[1]).toFixed(4)} i`;
    drawOrbit(); dirty = false;
  }
  function position(event, bounds) {
    const rect = event.currentTarget.getBoundingClientRect();
    return ij_to_xy([(event.clientX-rect.left)/rect.width*1000,
      (event.clientY-rect.top)/rect.height*1000], ...bounds, 1001);
  }
  // Manual selection is enabled when the shared tour is paused.
  function choose(event) {
    if (state.auto) return;
    c = position(event, mandelBounds); dirty = true;
  }
  parameter.addEventListener('pointerdown', event => {
    parameter.setPointerCapture(event.pointerId); choose(event);
  });
  parameter.addEventListener('pointermove', event => {
    if (parameter.hasPointerCapture(event.pointerId)) choose(event);
  });
  orbit.addEventListener('pointermove', event => {
    orbitPoint = position(event, juliaBounds); drawOrbit();
  });
  orbit.addEventListener('pointerleave', () => {
    orbitPoint = null; orbitPath.setAttribute('d', ''); orbitStart.setAttribute('visibility', 'hidden');
  });
  function resize() { mandel(c); dirty = true; }
  new ResizeObserver(resize).observe(document.querySelector('#pictures'));
  onThemeChange(resize);
  resize(); draw();
  let previous = performance.now(), lastDraw = 0, travel = 0, finished = false;
  onVisit(() => { travel = 0; finished = false; });
  function animate(now) {
    const dt = Math.min(100, now - previous) / 1000; previous = now;
    if (state.active) {
      if (state.auto && !finished) {
        if (!wasAuto) { blendFrom = [...c]; blend = 0; }
        const step = Math.min(dt * 2 * Math.PI / 24, 6*Math.PI-travel);
        theta += step; travel += step;
        blend = Math.min(1, blend + dt);
        const target = tourPath(theta);
        const ease = blend * blend * (3 - 2 * blend);
        c = target.map((x,i) => blendFrom[i] * (1-ease) + x*ease);
        dirty = true;
        if (travel >= 6*Math.PI) { draw(); finished = true; complete(); }
      }
      wasAuto = state.auto;
      // Limit GPU work to 30 fps, and do none for inactive slides.
      if (dirty && now - lastDraw >= 1000/30) { draw(); lastDraw = now; }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate); ready();
} catch (error) { reportError(error); }
