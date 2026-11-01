// Quarto project hook: only documents explicitly opting in are processed.
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');

async function main() {
  const root = process.env.QUARTO_PROJECT_DIR || process.cwd();
  const listFile = process.env.QUARTO_USE_FILE_FOR_PROJECT_INPUT_FILES;
  const inputs = listFile
    ? readFileSync(listFile, 'utf8')
    : process.env.QUARTO_PROJECT_INPUT_FILES || '';
  for (const input of inputs.split(/\r?\n/).filter(Boolean)) {
    if (!/\.qmd$/i.test(input)) continue;
    const source = resolve(root, input);
    const text = readFileSync(source, 'utf8');
    const frontMatter = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!frontMatter || !/^export-svg-figures:\s*true\s*(?:#.*)?$/m.test(frontMatter[1])) continue;
    console.log(`Preparing PDF figures for ${input}`);
    const {exportFigures} = require('./export-figures.cjs');
    await exportFigures({source, savedSvg: true});
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
