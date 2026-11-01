# Marks Math on Github

This is the Github repo for my [Mark's Math](https://marksmath.org) webpage. It's Apache 2.0 licensed so anyone is free to download it and learn from it.

## About

Mark's Math is a [Quarto project](https://quarto.org/) - a great choice for academics in the technical disciplines. Quarto allows you to

- Create beautiful webpages built on modern standards using [Bootstrap styling](https://getbootstrap.com/),
- Incorporate R, Python, and (Observable based) Javascript to create output and to expose the code when appropriate,
- Use native LaTeX syntax for Mathematical typesetting, and 
- Generate output in a variety of formats, including HTML, PDF, and RevealJS (for presentations).

## Usage

If you download the project and install Quarto, then you should be able to simply cd from the command line into the project folder and execute

    quarto preview
    
to explore the project or 

    quarto render
    
to generate your own version for deployment.

## Exporting Observable figures for PDF handouts

The shared `scripts/export-figures.cjs` command exports the SVG figures from a
rendered Quarto page as vector PDFs using Google Chrome. It preserves the browser
fonts and avoids the font-mapping issue encountered with `rsvg-convert`.
Requires Node.js, Google Chrome, and Playwright (`npm install --no-save playwright`).

Give the HTML/OJS figure and its PDF image reference the same label, for example:

````markdown
::: {.content-visible when-format="html"}
```{ojs}
//| label: fig-example
//| fig-cap: "An example plot."
Plot.plot({...})
```
:::

::: {.content-visible when-format="pdf"}
![An example plot.](figures/example.pdf){#fig-example fig-alt="Description of the plot."}
:::
````

Start `quarto preview`, then run from the repository root (use the preview's port):

```sh
node scripts/export-figures.cjs classes/Fall2026CalcI/handouts/ReviewForQuiz3 --url http://localhost:PORT/classes/Fall2026CalcI/handouts/ReviewForQuiz3/
```

The source argument can be any `.qmd` file, or a directory containing `index.qmd`.
The command discovers local PDF image references with `#fig-` labels, finds each
matching SVG on the page, and writes SVG and PDF files relative to that source.
Existing figure files are replaced. It handles SVG figures, not canvas plots;
figures must have explicit positive width and height. Interactive plots export
in their current/default state. Each figure label should identify one SVG.

To reconvert the saved SVGs without running a preview:

```sh
node scripts/export-figures.cjs classes/Fall2026CalcI/handouts/ReviewForQuiz3 --saved-svg
```

To convert saved SVGs automatically before a normal Quarto render, add this
at the top level of a document's YAML:

```yaml
export-svg-figures: true
```

The project pre-render hook processes only opted-in documents in the current
render. It regenerates their figure PDFs from the saved SVGs (which must already
exist), so `quarto render PATH` is sufficient, even when figure PDFs are missing.
This also runs during HTML renders; it does not launch a nested Quarto render.
When the OJS plots change, refresh their saved SVGs using the preview-URL command
above before rendering. The hook cannot detect whether saved SVGs match changed
OJS code.

After exporting, render the document with `quarto render PATH --to pdf`.
Figure export does not itself guarantee PDF/UA compliance; validate the finished
handout.

## Mapbox Tokens

I've got at least one Mapbox map that shows some nice [cycling routes near Asheville, NC](./visualization/data/cycling_maps/index.qmd). If you want to display Mapbox maps on another server, you'll need to create [your own public access keys](https://docs.mapbox.com/help/dive-deeper/access-tokens/) - one restricted in scope for deployment and one unrestricted for development. My strategy for managing these in Quarto is described in [this _environment file](./_environment).
