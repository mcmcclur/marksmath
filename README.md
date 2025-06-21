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

## Mapbox Tokens

I've got at least one Mapbox map that shows some nice [cycling routes near Asheville, NC](./visualization/data/cycling_maps/index.qmd). If you want to display Mapbox maps on another server, you'll need to create [your own public access keys](https://docs.mapbox.com/help/dive-deeper/access-tokens/) - one restricted in scope for deployment and one unrestricted for development. My strategy for managing these in Quarto is described in [this _environment file](./_environment).
