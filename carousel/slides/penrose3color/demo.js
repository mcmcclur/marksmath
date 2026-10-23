import {state, ready, reportError, onVisit, complete} from '../slide-state.js';
import {coloring} from './model.js';
try {
  const response = await fetch('./patches.json');
  if (!response.ok) throw new Error('Unable to load Penrose geometry');
  const patches = await response.json();
  const buttons = [...document.querySelectorAll('#sizes button')];
  const find = document.querySelector('#find');
  const result = document.querySelector('#result');
  const picture = document.querySelector('#picture');
  let index = 0, rounds = 0, rhombs, model, paths;
  let phase = 'preview', hold = 1.5, generation = 0, manualSolve = false, stepTime = 0;
  function select(size) {
    index = size;
    rhombs = patches[buttons[index].dataset.n].map(r => ({...r, color: Math.floor(Math.random()*3)}));
    model = coloring(rhombs);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const phi = (1+Math.sqrt(5))/2;
    svg.setAttribute('viewBox', `-0.01 ${-1/phi-0.01} ${phi+0.02} ${2/phi+0.02}`);
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${rhombs.length} Penrose tiles`);
    paths = rhombs.map(r => {
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', r.vertices.map(([x,y], i) => `${i ? 'L':'M'}${x},${-y}`).join(' ')+' Z');
      path.setAttribute('stroke', 'black'); path.setAttribute('stroke-width', '0.002');
      svg.append(path); return path;
    });
    picture.replaceChildren(svg);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i===index)));
    phase = 'preview'; hold = 1.5; generation = 0; manualSolve = false; stepTime = 0;
    find.disabled = false; result.value = `${rhombs.length} tiles`;
    paint();
  }
  function paint() {
    paths.forEach((path,i) => path.setAttribute('fill', model.color(rhombs[i].color)));
  }
  function start() { phase = 'solve'; find.disabled = true; }
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  find.addEventListener('click', start);
  select(0);
  onVisit(() => { rounds = 0; select(0); });
  let previous = performance.now();
  function animate(now) {
    const dt = Math.min(100, now-previous)/1000; previous = now;
    if (state.active) {
      if (state.auto) manualSolve = false;
      if (phase === 'preview' && state.auto) {
        hold -= dt; if (hold <= 0) start();
      }
      if (phase === 'solve' && (state.auto || manualSolve)) {
        // A paused tour freezes its solver. A visitor may explicitly restart it.
        stepTime += dt;
        if (stepTime >= 1/30) {
          stepTime = 0;
          let steps = 0;
          const deadline = performance.now()+6;
          do {
            if (model.valid(rhombs.map(r => r.color))) {
              phase = 'result'; hold = 2.5; manualSolve = false;
              result.value = `Three coloring found · ${generation} generations`;
              break;
            }
            const colors = rhombs.map(model.recolor);
            rhombs.forEach((r,i) => { r.color = colors[i]; }); generation++;
          } while (++steps < Math.ceil(rhombs.length/100) && performance.now()<deadline);
          paint();
          if (phase === 'solve') result.value = `Finding three coloring · ${generation} generations`;
        }
      }
      if (phase === 'result' && state.auto) {
        hold -= dt;
        if (hold <= 0) {
          if (index === buttons.length-1 && ++rounds >= 2) {
            phase = 'done'; complete();
          } else select((index+1)%buttons.length);
        }
      }
    }
    requestAnimationFrame(animate);
  }
  find.addEventListener('click', () => { manualSolve = true; });
  requestAnimationFrame(animate); ready();
} catch (error) { reportError(error); }
