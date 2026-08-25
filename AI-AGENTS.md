# AI-AGENTS.md

## Purpose

This repository contains the source for [Mark's Math](https://marksmath.org/), a Quarto website with course materials, mathematical visualizations, writing, presentations, data notes, and shared site components.

This file gives AI coding agents enough context to make useful, careful changes without damaging generated output or site conventions.

## Repository Overview

- Quarto website project configured by `_quarto.yml`
- Main content written in `.qmd` files
- Site sections include:
  - `classes/` — course pages, syllabi, calendars, notes, handouts, demos
  - `visualization/` — math, classroom, and data visualizations
  - `writ/` — essays, reports, and longer-form writing
  - `scholarship/` — scholarly materials
  - `presentations/` — presentation-related pages
  - `data/` — data-oriented pages and supporting files
  - `components/`, `jslib/`, `share/` — shared JavaScript, CSS, includes, and reusable assets

## Important Files and Directories

- `_quarto.yml` — global Quarto website configuration
- `README.md` — public project overview and basic usage
- `styles.css` — global site styling
- `mathjax-config.html` — MathJax configuration included in HTML output
- `_site/` — generated website output; normally do not edit by hand
- `_freeze/` and `.quarto/` — Quarto cache/freeze/build metadata; avoid unnecessary edits

## Local Development

Common commands:

```sh
quarto preview
quarto render
```

Use `quarto preview` for interactive checking and `quarto render` before validating broader site changes.

## Editing Guidelines

- Prefer small, focused changes.
- Preserve existing Quarto structure and naming patterns.
- Keep mathematical notation in standard LaTeX syntax.
- Avoid hand-editing generated output in `_site/`.
- Do not disturb frozen computations unless the task requires it.
- When editing course materials, preserve dates, course names, and pedagogical intent unless explicitly asked to update them.
- When editing visualizations, check both the `.qmd` source and any linked JavaScript/CSS assets.

## Quarto Conventions

Document pages generally use:

- YAML front matter where needed
- Markdown prose
- LaTeX math
- Executable code chunks when appropriate
- Embedded JavaScript or Observable-style content for interactive pieces

Global site behavior comes from `_quarto.yml`, including themes, MathJax setup, page layout, navbar links, footer, resources, and execution freeze behavior.

## Content Areas

### Classes

The `classes` directory is reserved for class webpages, for example:

- `classes/Fall2025CalcI/`
- `classes/Fall2025LinearAlgebra/`
- `classes/Spring2026CalcIII/`
- `classes/Spring2026MML/`

This includes notes on syllabi, calendars, handouts, demos, and reusable course components. Often, the demos are interactive visualizations generated using Javascript, as described in the next section on visualizations.

### Visualizations

The `visualization` directory contains mathematical and data visualizations that might be used in classes but are often shared more broadly. These are broken into

- `visualization/data/*` contains pure data visualizations
  - for example `visualization/data/NCAABrackets/` provides NCAA bracket visualization dating back to 1984.
- `visualization/math/*` contains advanced mathematical visualizations of general interest
  - for example, `visualization/math/JuliaSetsAndMandelbrotSet` provides an interactive look at Julia sets and the Mandelbrot set
- `visualization/class/` contains class specific visualizations that I might refer to frequently across multiple classes
  - for example, `visualization/class/unit_circle` provides an interactive look at the unit circle.

Generally, these directories contain
  - QMD files to describe the visualizations in Quarto based markdown. These files frequently use `ojs` code blocks to coordinate Javascript visualizations written in Observable flavored Javascript.
  - JS files to generate the pure javascript visualizations.
  - CSV or JSON data files to store any data we'd like to visualize.
  - IPython notebooks used for processing raw data to a form more palatable form for Javascript.

### Writing

The `writ/` directory contains my own writing on various subjects. Often, these writings are accompanied by visualizations, as in the previous section on visualization.

### Data

The `data` directory contains raw data, largely for sharing.


## Working practices

### Secrets and External Services

- Do not commit secrets, private API keys, or unrestricted tokens.
- Mapbox-related work may require local environment configuration.
- Check existing environment conventions before adding new service dependencies.

### Validation Checklist

Before finishing a change, consider:

- Does the edited `.qmd` render?
- Are links still valid?
- Does math display correctly?
- Do visualizations load required JS/CSS/assets?
- Did any generated files change unintentionally?
- Is the change scoped to source files rather than build output?


### Agent-Specific Instructions

AI agents working in this repo should:

- Read nearby files before making stylistic changes.
- Match existing tone, structure, and formatting.
- Prefer Quarto-native solutions over custom HTML/JS when Quarto already supports the feature.
- Keep generated/cache directories out of ordinary edits.
- Explain any broad changes before making them.
- Flag uncertainty around course policies, assignment dates, grading language, or public-facing claims.