import katex from 'https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/katex.mjs';
import {state, ready, reportError} from '../slide-state.js';
import {labels} from './labels.js';
import {handAngles} from './time.js';

try {
  const clock = document.querySelector('#clock');
  const space = document.querySelector('#clock-space');
  const tickGroup = document.querySelector('#ticks');
  for (let i=0; i<60; i++) {
    const major = i%5===0;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (const [key,value] of Object.entries({x1:500,y1:43,x2:500,y2:major?78:64,
      'stroke-width':major?10:1.5, transform:`rotate(${i*6} 500 500)`})) line.setAttribute(key,value);
    tickGroup.append(line);
  }
  const elements = labels.map(label => {
    const node = document.createElement('div');
    node.className = 'math-label';
    node.style.left = `${100*label.x}%`; node.style.top = `${100*label.y}%`;
    node.dataset.hour = label.hour;
    node.title = `Equals ${label.hour}.${label.note ? ' '+label.note : ''}`;
    katex.render(label.tex.replace(/^\\frac/, '\\dfrac'), node, {displayMode:false, throwOnError:true, output:'htmlAndMathml', strict:'error'});
    document.querySelector('#labels').append(node);
    return node;
  });
  function resize() {
    const {width,height} = space.getBoundingClientRect();
    const diameter = Math.max(0, Math.min(width,height,1100));
    clock.style.width = clock.style.height = `${diameter}px`;
    if (!diameter) return;
    elements.forEach((node,i) => {
      const size = diameter*0.023;
      node.style.fontSize = `${size}px`;
      const naturalWidth = node.getBoundingClientRect().width;
      const allowedWidth = diameter*labels[i].width;
      const allowedHeight = diameter*([2,4,6,8].includes(labels[i].hour) ? 0.095 : 0.075);
      const naturalHeight = node.getBoundingClientRect().height;
      const scale = Math.min(1, allowedWidth/naturalWidth, allowedHeight/naturalHeight);
      node.style.fontSize = `${size*scale}px`;
    });
  }
  const observer = new ResizeObserver(resize); observer.observe(space);
  // Re-fit after KaTeX fonts arrive, including when the iframe was initially hidden.
  await document.fonts.ready;
  resize();
  document.fonts.addEventListener('loadingdone', resize);
  const hands = Object.fromEntries(['hour','minute','second'].map(name=>[name,document.querySelector('#'+name)]));
  let last = 0, spokenMinute = '';
  function animate(timestamp) {
    // Keep actual local time while the tour is paused; skip work in hidden slides.
    if (state.active && timestamp-last>=1000/30) {
      const now = new Date();
      for (const [name,angle] of Object.entries(handAngles(now))) hands[name].setAttribute('transform',`rotate(${angle} 500 500)`);
      const minute = `${now.getHours()}:${now.getMinutes()}`;
      if (minute!==spokenMinute) {
        document.querySelector('#hands').setAttribute('aria-label', `Local time ${now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`);
        spokenMinute = minute;
      }
      last = timestamp;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  ready();
} catch(error) { reportError(error); }
