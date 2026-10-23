import {applyTheme} from './theme.js';
// Same-origin messages keep embedded demos independent of the carousel's DOM.
export const state = {active: window.parent === window, auto: window.parent === window, visit: 0};
const visits = new Set();
let activeVisit = null, finished = false;
let isReady = false;
let loadFailed = false;
window.addEventListener('message', event => {
  if (event.origin === location.origin && event.source === window.parent &&
      event.data?.type === 'math-demo-ready-request') {
    if (isReady) ready();
    else if (loadFailed) window.parent.postMessage({type: 'math-demo-error'}, location.origin);
  }
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== window.parent ||
      event.data?.type !== 'math-carousel-state') return;
  applyTheme(event.data.theme);
  state.active = Boolean(event.data.active);
  state.auto = Boolean(event.data.auto);
  state.visit = event.data.visit;
  if (state.active && activeVisit !== state.visit) {
    activeVisit = state.visit; finished = false;
    visits.forEach(callback => callback());
  }
});
export function onVisit(callback) {
  visits.add(callback);
  if (state.active) callback();
}
export function complete() {
  if (finished) return;
  finished = true;
  window.parent.postMessage({type: 'math-demo-complete', visit: state.visit}, location.origin);
}
export function ready() {
  isReady = true;
  window.parent.postMessage({type: 'math-demo-ready'}, location.origin);
}
export function reportError(error) {
  loadFailed = true;
  console.error(error);
  const message = document.createElement('p');
  message.setAttribute('role', 'alert');
  message.textContent = 'This demo could not load. Check the internet connection and reload.';
  document.body.append(message);
  window.parent.postMessage({type: 'math-demo-error'}, location.origin);
}
