// Negative-input crossings of exp(x(log|x| + i pi (2k+1))).
// Reduce x to a rational key so crossings shared by branches appear only once.
export function real_intersections(count, xmin = -2) {
  const points = new Map();
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  for (let k = -count; k <= count; k++) {
    const denominator = Math.abs(2 * k + 1);
    for (let numerator = 1; numerator <= Math.floor(-xmin * denominator); numerator++) {
      const divisor = gcd(numerator, denominator);
      const key = `${numerator / divisor}/${denominator / divisor}`;
      if (points.has(key)) continue;
      const x = -numerator / denominator;
      const y = (numerator % 2 ? -1 : 1) * Math.exp(x * Math.log(-x));
      points.set(key, [x, y]);
    }
  }
  return [...points.values()].sort((a, b) => a[0] - b[0]);
}

export function real_intersection_plot(count, { width = 800 } = {}) {
  const points = real_intersections(count);
  const height = 390;
  const margin = { left: 52, right: 24, top: 32, bottom: 42 };
  const xscale = x => margin.left + (x + 2) / 4 * (width - margin.left - margin.right);
  const yscale = y => height - margin.bottom - (y + 2) / 6 * (height - margin.top - margin.bottom);
  const svgNS = "http://www.w3.org/2000/svg";
  function element(name, attributes = {}, text) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  }
  const svg = element("svg", {
    viewBox: `0 0 ${width} ${height}`, width, height,
    role: "img", "aria-label": `Real-plane crossings for branches −${count} through ${count}, with the positive real curve x to the x.`,
    style: "display:block;width:100%;height:auto;overflow:visible;color:inherit;font:14px sans-serif"
  });
  svg.append(element("title", {}, "Real-plane intersections of the spindle"));
  svg.append(element("desc", {}, "The solid curve is x to the x for positive x. Dots mark exact crossings of the selected negative-input branches with the real plane; they are not projections of the threads."));
  const grid = element("g", { stroke: "currentColor", "stroke-opacity": 0.12 });
  for (let x = -2; x <= 2; x++) {
    grid.append(element("line", { x1: xscale(x), x2: xscale(x), y1: margin.top, y2: height - margin.bottom }));
    svg.append(element("text", { x: xscale(x), y: height - margin.bottom + 23, "text-anchor": "middle", fill: "currentColor" }, x));
  }
  for (let y = -2; y <= 4; y++) {
    grid.append(element("line", { x1: margin.left, x2: width - margin.right, y1: yscale(y), y2: yscale(y) }));
    svg.append(element("text", { x: margin.left - 12, y: yscale(y) + 5, "text-anchor": "end", fill: "currentColor" }, y));
  }
  svg.append(grid);
  const axes = element("g", { stroke: "currentColor", "stroke-opacity": 0.6 });
  axes.append(element("line", { x1: margin.left, x2: width - margin.right, y1: yscale(0), y2: yscale(0) }));
  axes.append(element("line", { x1: xscale(0), x2: xscale(0), y1: margin.top, y2: height - margin.bottom }));
  svg.append(axes);
  svg.append(element("text", { x: width - margin.right, y: height - 5, "text-anchor": "end", fill: "currentColor" }, "x"));
  svg.append(element("text", { x: margin.left, y: 18, fill: "currentColor" }, "Re(xˣ)"));
  const curve = Array.from({ length: 401 }, (_, i) => {
    const x = i / 200;
    const y = x === 0 ? 1 : Math.exp(x * Math.log(x));
    return `${i ? "L" : "M"}${xscale(x)},${yscale(y)}`;
  }).join(" ");
  svg.append(element("path", { d: curve, fill: "none", stroke: "currentColor", "stroke-width": 2.5 }));
  const dots = element("g", { fill: "currentColor", "fill-opacity": 0.55 });
  for (const [x, y] of points) {
    const dot = element("circle", { cx: xscale(x), cy: yscale(y), r: 2.5 });
    dot.append(element("title", {}, `x = ${x.toPrecision(6)}, Re(xˣ) = ${y.toPrecision(6)}`));
    dots.append(dot);
  }
  svg.append(dots);
  return svg;
}
