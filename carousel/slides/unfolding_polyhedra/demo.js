import {onThemeChange} from '../theme.js';
import {state, ready, reportError, onVisit, complete} from '../slide-state.js';

try {
  const [{Runtime}, {Library}, {default: primitives}, {createPolyhedron}, d3, data] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/@observablehq/runtime@5/+esm'),
    import('https://cdn.jsdelivr.net/npm/@observablehq/stdlib@5/+esm'),
    import('./primitives.js'), import('./polyhedron.js'),
    import('https://cdn.jsdelivr.net/npm/d3@7/+esm'),
    fetch('./unfoldings.json').then(response => {
      if (!response.ok) throw new Error('Unable to load polyhedron data');
      return response.json();
    })
  ]);
  const runtime = new Runtime(new Library());
  const helpers = runtime.module(primitives);
  const names = ['create_indexedFaceSet', 'create_indexedLineSet', 'create_transform', 'show_x3d'];
  const [faces, lines, transform, show] = await Promise.all(names.map(name => helpers.value(name)));
  // The first interactive uses only the cross product from the utilities notebook.
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const classes = document.querySelector('#class');
  const solids = document.querySelector('#solid');
  const unfold = document.querySelector('#unfold');
  const amount = document.querySelector('#amount');
  const picture = document.querySelector('#picture');
  data.forEach((group, i) => classes.add(new Option(group.class, i)));
  let invalidate = () => {}, generation = 0;
  function draw() {
    invalidate();
    const invalidation = new Promise(resolve => { invalidate = resolve; });
    const solid = data[+classes.value].class_data[+solids.value];
    // The copied generator attaches the scene before initializing X3DOM.
    const generator = createPolyhedron(faces, solid, d3, lines, transform, cross, show, unfold, invalidation);
    picture.replaceChildren(generator.next().value);
    generator.next();
    const current = ++generation;
    // A newly selected solid inherits the current slider position.
    requestAnimationFrame(() => {
      if (generation === current) unfold.dispatchEvent(new Event('input'));
    });
  }
  function populateSolids(index = 0) {
    solids.replaceChildren();
    data[+classes.value].class_data.forEach((solid, i) => solids.add(new Option(solid.name, i)));
    solids.selectedIndex = index;
  }
  function selectClass() {
    populateSolids();
    draw();
  }
  function randomExample() {
    const previousClass = classes.value;
    const previousSolid = solids.value;
    const classIndex = Math.floor(Math.random() * data.length);
    const choices = data[classIndex].class_data.map((_, i) => i)
      .filter(i => String(classIndex) !== previousClass || String(i) !== previousSolid);
    const solidIndex = choices[Math.floor(Math.random() * choices.length)];
    classes.value = String(classIndex);
    populateSolids(solidIndex);
    draw();
    resize();
  }
  classes.addEventListener('change', selectClass);
  solids.addEventListener('change', draw);
  unfold.addEventListener('input', () => { amount.value = `${Math.round(+unfold.value * 100)}%`; });
  randomExample();
  onThemeChange(dark => {
    const background = picture.querySelector('background');
    if (background) background.setAttribute('skyColor', dark ? '0.067 0.106 0.149' : '0.965 0.980 0.988');
  });
  // Resize the existing scene so fullscreen preserves camera and unfolding state.
  function resize() {
    const rect = picture.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const container = picture.firstElementChild;
    const scene = picture.querySelector('x3d');
    if (!scene) return;
    container.style.width = `${width}px`; container.style.height = `${height}px`;
    scene.setAttribute('width', `${width}px`); scene.setAttribute('height', `${height}px`);
    scene.style.width = `${width}px`; scene.style.height = `${height}px`;
    const canvas = scene.querySelector('canvas');
    if (canvas) { canvas.style.width = `${width}px`; canvas.style.height = `${height}px`; }
  }
  new ResizeObserver(resize).observe(picture);
  window.addEventListener('resize', resize);
  resize();
  solids.addEventListener('change', resize);
  classes.addEventListener('change', resize);
  const pause = 1.5;
  let previous = performance.now(), phase = 'intro', hold = pause, cycles = 0;
  onVisit(() => {
    cycles = 0; phase = 'intro'; hold = pause;
    previous = performance.now();
    unfold.value = 0; unfold.dispatchEvent(new Event('input'));
  });
  function animate(now) {
    // A frame timestamp may precede initialization within that same frame.
    const dt = Math.max(0, Math.min(100, now - previous)) / 1000;
    previous = now;
    if (state.active && state.auto && dt > 0) {
      if (phase === 'intro' || phase === 'open' || phase === 'closed') {
        hold = Math.max(0, hold-dt);
        if (hold === 0) {
          if (phase === 'intro') phase = 'unfolding';
          else if (phase === 'open') phase = 'folding';
          else if (cycles === 5) { phase = 'finished'; complete(); }
          else {
            unfold.value = 0;
            randomExample();
            phase = 'intro'; hold = pause;
          }
        }
      } else if (phase === 'unfolding' || phase === 'folding') {
        const direction = phase === 'unfolding' ? 1 : -1;
        const next = Math.max(0, Math.min(1, +unfold.value + direction*dt/5));
        unfold.value = next;
        unfold.dispatchEvent(new Event('input'));
        if (phase === 'unfolding' && next === 1) { phase = 'open'; hold = pause; }
        else if (phase === 'folding' && next === 0) {
          cycles++; phase = 'closed'; hold = pause;
        }
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('pagehide', () => { invalidate(); runtime.dispose(); }, {once: true});
  ready();
} catch (error) { reportError(error); }
