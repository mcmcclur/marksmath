// With `quarto preview` running, regenerate all PDFs from the live OJS SVGs:
// node export-figure.cjs http://localhost:PORT/classes/Fall2026CalcI/handouts/ReviewForQuiz3/
// Requires Playwright, Google Chrome, and rsvg-convert on PATH.
// Install Playwright with `npm install --no-save playwright` if needed.
// Each PDF image in index.qmd must have the same #fig-label as its OJS cell.
// Rerun this after adding or editing figures, before rendering the handout PDF.
const {readFileSync, writeFileSync} = require('node:fs');
const {join} = require('node:path');
const {homedir} = require('node:os');
const {execFileSync} = require('node:child_process');
// Prefer a local installation; also support the bundled Codex runtime.
let chromium;
try {
  ({chromium} = require('playwright'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  ({chromium} = require(join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));
}

(async () => {
  const url = process.argv[2];
  if (!url) throw new Error('Pass the URL of the handout served by quarto preview.');
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, colorScheme: 'light'});
    await page.goto(url);
    const source = readFileSync(join(__dirname, 'index.qmd'), 'utf8');
    const figures = [...source.matchAll(/!\[[^\n]*\]\(([^)]+\.pdf)\)\{#(fig-[^\s}]+)/g)];
    if (!figures.length) throw new Error('No labeled PDF figures found in index.qmd.');
    for (const [, filename, label] of figures) {
      const figure = page.locator(`#${label} svg`);
      await figure.waitFor();
      const svg = await figure.evaluate(element => {
        const copy = element.cloneNode(true);
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        // Resolve inherited page styles for a standalone, printable SVG.
        copy.style.color = '#000';
        copy.style.font = getComputedStyle(element).font;
        return new XMLSerializer().serializeToString(copy);
      });
      const svgPath = join(__dirname, filename.replace(/\.pdf$/, '.svg'));
      writeFileSync(svgPath, svg);
      execFileSync('rsvg-convert', ['--format=pdf', '--output', join(__dirname, filename), svgPath]);
      console.log(`Exported ${label} to ${filename}`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
