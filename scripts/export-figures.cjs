// Export matching SVG/PDF figures from any Quarto document. See --help.
const {readFileSync, writeFileSync, mkdirSync, statSync} = require('node:fs');
const {join, resolve, dirname} = require('node:path');
const {homedir} = require('node:os');
// Prefer a local installation; also support the bundled Codex runtime.
let chromium;
try {
  ({chromium} = require('playwright'));
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  ({chromium} = require(join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')));
}

async function exportFigures({source, url, savedSvg = false}) {
  source = resolve(source);
  if (statSync(source).isDirectory()) source = join(source, 'index.qmd');
  const directory = dirname(source);
  if (!savedSvg && !url) throw new Error('Supply --url with the rendered HTML page URL, or --saved-svg.');
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, colorScheme: 'light'});
    if (!savedSvg) await page.goto(url);
    const pdfPage = await browser.newPage();
    await pdfPage.emulateMedia({media: 'screen'});
    const sourceText = readFileSync(source, 'utf8');
    const figures = [...sourceText.matchAll(/!\[[^\n]*\]\(([^)]+\.pdf)\)\{#(fig-[^\s}]+)/g)];
    if (!figures.length) throw new Error(`No labeled PDF figures found in ${source}. Expected ![caption](figure.pdf){#fig-name}.`);
    for (const [, filename, label] of figures) {
      if (/^(?:[a-z]+:|\/)/i.test(filename)) throw new Error(`Use a relative local figure path: ${filename}`);
      const pdfPath = resolve(directory, filename);
      mkdirSync(dirname(pdfPath), {recursive: true});
      const svgPath = pdfPath.replace(/\.pdf$/, '.svg');
      let svg;
      if (savedSvg) {
        svg = readFileSync(svgPath, 'utf8');
      } else {
        const figure = page.locator(`[id="${label}"] svg`);
        await figure.waitFor();
        svg = await figure.evaluate(element => {
          const copy = element.cloneNode(true);
          copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          // Resolve inherited page styles for a standalone, printable SVG.
          copy.style.color = '#000';
          copy.style.font = getComputedStyle(element).font;
          return new XMLSerializer().serializeToString(copy);
        });
        writeFileSync(svgPath, svg);
      }
      // Print the standalone SVG with the same browser that renders the HTML.
      // Cairo/rsvg-convert can omit CIDToGIDMap for macOS system fonts.
      await pdfPage.setContent(`<html><head><style>
        @page { margin: 0; }
        html, body { margin: 0; padding: 0; }
        svg { display: block; }
      </style></head><body>${svg}</body></html>`);
      await pdfPage.evaluate(() => document.fonts.ready);
      const size = await pdfPage.locator('svg').evaluate(element => ({
        width: element.width.baseVal.value,
        height: element.height.baseVal.value,
      }));
      if (!(size.width > 0 && size.height > 0)) throw new Error(`SVG for ${label} must have positive width and height.`);
      await pdfPage.pdf({
        path: pdfPath,
        width: `${size.width}px`, height: `${size.height}px`,
        margin: {top: 0, right: 0, bottom: 0, left: 0},
        printBackground: true,
      });
      console.log(`Exported ${label} to ${filename}`);
    }
  } finally {
    await browser.close();
  }
}

async function main(args = process.argv.slice(2)) {
  if (!args.length || args.includes('--help')) {
    console.log(`Export labeled Quarto SVG figures as vector PDFs.
Usage: node scripts/export-figures.cjs SOURCE --url PAGE_URL
       node scripts/export-figures.cjs SOURCE --saved-svg
SOURCE is a .qmd file or a directory containing index.qmd.
The PDF reference and live SVG must share the same #fig-name label.
Requires Playwright and Google Chrome. Existing figure PDFs are replaced.`);
    return;
  }
  const source = args.shift();
  let url;
  let savedSvg = false;
  while (args.length) {
    const option = args.shift();
    if (option === '--url') {
      url = args.shift();
      if (!url) throw new Error('--url requires a page URL.');
    } else if (option === '--saved-svg') savedSvg = true;
    else throw new Error(`Unknown option: ${option}`);
  }
  if (url && savedSvg) throw new Error('Choose --url or --saved-svg.');
  await exportFigures({source, url, savedSvg});
}

module.exports = {exportFigures, main};
if (require.main === module) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
