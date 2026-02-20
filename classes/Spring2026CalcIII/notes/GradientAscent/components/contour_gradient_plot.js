import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

export function contour_gradient_plot (f, opts = {}) {
  let {
    xdomain = [-4,4],
    ydomain = [-4,4],
    width = 500,
    height = 500,
    step = 0.05,
    legend = true,
    s = 0.1,
    g = null
  } = opts;
  
  const [xmin,xmax] = xdomain;
  const [ymin,ymax] = ydomain;
  

  let contour_data = d3.range(ymin, ymax + step / 2, step).map((y) =>
    d3.range(xmin, xmax + step / 2, step).map(function (x) {
      return {
        x: x,
        y: y,
        z: f(x, y)
      };
    })
  );
  const contour_height = contour_data.length;
  const contour_width = contour_data[0].length;
  contour_data = contour_data.flat();
  const [zmin, zmax] = d3.extent(contour_data, (o) => o.z);
  const contour_mark = Plot.contour(contour_data, {
    x: "x",
    y: "y",
    fill: "z",
    stroke: "rgba(0,0,0,0.5)",
    width: contour_width,
    height: contour_height
  });
  
  let marks;
  if(g) {
    let arrow_data = d3
      .range(ymin, ymax + step / 2, 15 * step)
      .map((y) =>
      d3.range(xmin, xmax + step / 2, 15 * step).map(function (x) {
        const dx = g(x, y)[0] * s;
        const dy = g(x, y)[1] * s;
        return {
          x1: x,
          x2: x + dx,
          y1: y,
          y2: y + dy
        };
      })
    );
    const arrow_height = arrow_data.length;
    const arrow_width = arrow_data[0].length;
    arrow_data = arrow_data.flat();

    const arrow_mark = Plot.arrow(arrow_data, {
      x1: "x1",
      x2: "x2",
      y1: "y1",
      y2: "y2",
      width: arrow_width,
      height: arrow_height,
      stroke: "rgba(0,0,0,0.7)",
      clip: true
    });
    
    marks = [contour_mark, arrow_mark];
  }
  else {
    marks = [contour_mark];
  }
  
  return Plot.plot({
    x: { domain: [xmin, xmax], ticks: 5 },
    y: { domain: [ymin, ymax], ticks: 5 },
    color: {
      scheme: "Blues",
      domain: [zmin, zmax],
      reverse: true,
      legend
    },
    width,
    height,
    marks
  });
}
