import {state, ready, reportError, onVisit, complete} from '../slide-state.js';
import {Network} from './network.js';

try {
  const response = await fetch('./multiplication_model.json');
  if (!response.ok) throw new Error('Unable to load the trained multiplier');
  const network = new Network(await response.json());
  const picture = document.querySelector('#network');
  const equation = document.querySelector('#equation span');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = element('svg', {viewBox: '0 0 1280 600', role: 'img', 'aria-label': 'Feedforward neural network with two inputs, hidden layers of six and four nodes, and one output'});
  picture.append(svg);
  function element(tag, attributes = {}, text) {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const edgeGroup = element('g'), nodeGroup = element('g'), labelGroup = element('g');
  svg.append(edgeGroup, nodeGroup, labelGroup);
  const columns = [300, 527, 753, 980];
  const sizes = [2, 6, 4, 1];
  const names = ['Inputs', 'Hidden layer', 'Hidden layer', 'Output'];
  const layers = sizes.map((size, layer) => {
    labelGroup.append(element('text', {x: columns[layer], y: 26, class: 'layer-name'}, names[layer]));
    return Array.from({length: size}, (_, i) => {
      const x = columns[layer];
      const spread = layer === 0 ? 200 : (size-1)*88;
      const y = size === 1 ? 300 : 300-spread/2 + i*spread/(size-1);
      const circle = element('circle', {cx: x, cy: y, r: 22, class: 'node', fill: 'var(--node-idle)'});
      const title = element('title'); circle.append(title); nodeGroup.append(circle);
      let label;
      if (layer === 0 || layer === sizes.length-1) {
        label = element('text', {x: x+(layer===0 ? -42 : 42), y, dy: '0.35em', class: 'node-value', 'text-anchor': layer===0 ? 'end' : 'start'});
        labelGroup.append(label);
      }
      return {x, y, circle, title, label, value: 0, at: 0};
    });
  });
  let activationEnd = 0;
  const edges = [];
  for (let layer = 1; layer < layers.length; layer++) {
    const begin = layer===1 ? 0.6 : activationEnd+0.35;
    layers[layer].forEach((target, j) => {
      target.at = begin+0.35*j+0.7;
      activationEnd = Math.max(activationEnd, target.at);
      layers[layer-1].forEach((source, i) => {
        const line = element('line', {x1: source.x, y1: source.y, x2: target.x, y2: target.y,
          stroke: 'var(--network-edge)', 'stroke-width': 2, opacity: 0.55, 'stroke-linecap': 'round'});
        const length = Math.hypot(target.x-source.x, target.y-source.y);
        line.setAttribute('stroke-dasharray', `${length} ${length}`);
        edgeGroup.append(line);
        edges.push({line, length, start: begin+0.35*j+i*0.035, end: target.at});
      });
    });
  }
  const resultAt = activationEnd+0.25;
  const pauseAfter = 2.5;
  let cycle = 0, elapsed = 0, finished = false, result, shown = false, pendingEquation = '';
  function format(value) { return (Math.abs(value)<0.0005 ? 0 : value).toFixed(3).replace('-', '−'); }
  function factor(value) { const text = format(value); return value<0 ? `(${text})` : text; }
  function color(value) {
    const t = Math.min(1, Math.abs(value));
    const end = value<0 ? [178,24,43] : [33,102,172];
    return `rgb(${end.map(channel => Math.round(247+(channel-247)*t)).join(',')})`;
  }
  function beginCycle(random = false) {
    // The opening example matches the one requested; subsequent inputs are random.
    const input = cycle===0 && !random ? [0.173, -0.423] : Array.from({length:2}, () => Math.round((2*Math.random()-1)*1000)/1000);
    const forward = network.forward(input);
    const values = [input, ...forward.map(layer => layer.a)];
    result = values.at(-1)[0];
    layers.forEach((layer, i) => layer.forEach((node,j) => {
      node.value = values[i][j]; node.title.textContent = format(node.value);
      if (node.label) node.label.textContent = format(node.value);
    }));
    pendingEquation = `${factor(input[0])} × ${factor(input[1])} ≈ ${format(result)}`;
    equation.textContent = '';
    shown = false; elapsed = 0; render();
  }
  function render() {
    edges.forEach(({line, length, start, end}) => {
      const progress = Math.max(0, Math.min(1, (elapsed-start)/(end-start)));
      line.setAttribute('stroke-dashoffset', length*(1-progress));
    });
    layers.forEach((layer,i) => layer.forEach(node => {
      const active = i===0 || elapsed>=node.at;
      node.circle.setAttribute('fill', active ? color(node.value) : 'var(--node-idle)');
      node.circle.setAttribute('r', active && i>0 ? 22+4*Math.max(0,1-(elapsed-node.at)/0.4) : 22);
      if (node.label) node.label.setAttribute('visibility', active ? 'visible' : 'hidden');
    }));
    const progress = Math.max(0, Math.min(1, (elapsed-resultAt)/0.35));
    equation.style.opacity = progress;
    equation.style.transform = `translateY(${8*(1-progress)}px) scale(${0.96+0.04*progress})`;
    if (!shown && elapsed>=resultAt) {
      equation.textContent = pendingEquation;
      svg.setAttribute('aria-label', `Neural network computation: ${pendingEquation}`);
      shown = true;
    }
  }
  beginCycle();
  let manualRun = false;
  onVisit(() => { cycle = 0; finished = false; manualRun = false; beginCycle(); });
  let previous = performance.now();
  document.querySelector('#redraw').addEventListener('click', () => {
    finished = false; manualRun = !state.auto; previous = performance.now();
    beginCycle(true);
  });
  function animate(now) {
    const dt = Math.min(100, now-previous)/1000; previous = now;
    if (state.active && (state.auto || manualRun) && !finished) {
      // Speed up the computation while preserving the pause to read its result.
      const readingStarts = resultAt+0.35;
      if (elapsed < readingStarts) {
        const computationTime = Math.min(dt, (readingStarts-elapsed)/3);
        elapsed += 3*computationTime + (dt-computationTime);
      } else elapsed += dt;
      render();
      if (elapsed>=resultAt+0.35+pauseAfter) {
        if (!state.auto) { manualRun = false; }
        else if (++cycle===5) { finished = true; manualRun = false; complete(); }
        else beginCycle();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate); ready();
} catch (error) { reportError(error); }
