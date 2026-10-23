const preference = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();
export const theme = {dark: preference.matches};
export function applyTheme(mode) {
  if (mode !== 'dark' && mode !== 'light') return;
  const dark = mode === 'dark';
  const changed = document.documentElement.dataset.theme !== mode;
  theme.dark = dark;
  document.documentElement.dataset.theme = mode;
  if (changed) listeners.forEach(callback => callback(dark));
}
export function onThemeChange(callback) {
  listeners.add(callback); callback(theme.dark);
}
// Use the site's explicit choice when embedded, and the OS preference standalone.
let initial = preference.matches ? 'dark' : 'light';
try {
  if (window.parent !== window) initial = window.parent.document.body.classList.contains('quarto-dark') ? 'dark' : 'light';
} catch { /* A standalone cross-origin embed follows its OS preference until messaged. */ }
applyTheme(initial);
preference.addEventListener('change', event => {
  if (window.parent === window) applyTheme(event.matches ? 'dark' : 'light');
});
