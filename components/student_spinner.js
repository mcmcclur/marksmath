import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function make_wheel(names) {
  const width = 640, height = 640;
  const rOuter = Math.min(width, height) / 2 - 8;
  const rInner = rOuter * 0.55;             // inner radius for donut
  const labelPadIn = 8;                      // space after inner radius before text
  const labelPadOut = 8;                     // space before outer radius
  const labelR0 = rInner + labelPadIn;
  const labelR1 = rOuter - labelPadOut;
  const labelTrack = labelR1 - labelR0;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width/2, -height/2, width, height])
    .attr("style", "max-width: 100%; height: auto; display: block; background:#0f0f0f05;");

  svg.append('polygon')
    .attr('points', [[-10,-140],[10,-140], [0,-166]])
    .attr('fill', 'black')

  const wheel = svg.append('g')

  // outer circle guide
  wheel.append("circle")
    .attr("r", rOuter)
    .attr("fill", "none")
    .attr("stroke", "#222")
    .attr("stroke-width", 2);

  // pie layout (equal slices)
  const n = names.length;
  const pie = d3.pie()
    .value(() => 1)
    .sort(null)
    .padAngle(0.004)
    .startAngle(-Math.PI/n)
    .endAngle(2*Math.PI - Math.PI/n)

  const arcs = pie(names);

  // color logic
  const green = "#0A7F00"; // single green wedge for odd n
  const red = "#BB0000";
  const black = "#000";
  const fillFor = i => {
    if (n % 2 === 1) {
      if (i === 0) return green;
      // alternate black/red for remaining
      return (i % 2 === 0) ? black : red;
    }
    // even n: strict alternation black/red
    return (i % 2 === 0) ? black : red;
  };

  // arc generator
  const arc = d3.arc()
    .innerRadius(rInner)
    .outerRadius(rOuter);

  // draw wedges
  wheel.append("g")
    .selectAll("path")
    .data(arcs)
    .join("path")
      .attr('class', (d,i) => `class${i}`)
      .attr("d", arc)
      .attr("fill", (_, i) => fillFor(i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

  // radial tick ring (optional roulette vibe)
  svg.append("circle")
    .attr("r", rInner)
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", 0.7);

  // labels: radial, outward, consistent rotation (no flips)
  const labels = wheel.append("g")
    .attr("font-family", "system-ui, -apple-system, Segoe UI, Roboto, sans-serif")
    .selectAll("text")
    .data(arcs)
    .join("text")
      .text(d => d.data)
      .attr("text-anchor", "start")     // start at inner radius and read outward
      .attr("dominant-baseline", "middle")
      .attr("transform", d => {
        const a = (d.startAngle + d.endAngle) / 2;  // mid-angle (radians)
        const deg = a * 180 / Math.PI - 90;              // rotate radially outward
        return `rotate(${deg})`;
      })
      .attr("x", labelR0)   // place the start of text at inner label radius
      .attr("y", 0)
      .attr("font-size", 24)
      .attr("fill", "#fff");
  // scale labels to fill the wedge track better
  labels.each(function(d) {
    const text = d3.select(this);
    // available radial length along the label baseline
    const available = Math.max(24, labelTrack); // clamp minimal room
    // initial measurement
    const len = this.getComputedTextLength();

    // If the name is longer than available, compress; if much shorter, gently expand.
    // Keep within reasonable bounds to avoid ugly distortions.
    const minScale = 0.7, maxScale = 1.35;
    const target = Math.max(12, Math.min(available, len * maxScale));
    const scale = Math.max(minScale, Math.min(maxScale, target / Math.max(1, len)));

    // Use textLength/lengthAdjust to scale along the baseline
    // text.attr("lengthAdjust", "spacingAndGlyphs")
    //     .attr("textLength", len * scale);
  });

  // center cap (roulette style)
  svg.append("circle")
    .attr("r", rInner * 0.2)
    .attr("fill", "#ddd")
    .attr("stroke", "#444")
    .attr("stroke-width", 1);

  function easeBackInExpOut(split = 0.35) {
    const easeStart = d3.easeBackIn;
    const easeEnd = d3.easeExpOut;
    return function(t) {
      if (t < split) {
        return easeStart(t / split) * split;
      } else {
        return split + easeEnd((t - split) / (1 - split)) * (1 - split);
      }
    };
  }


  // --- Animation helpers ---
  // Track the current absolute rotation (degrees)


  svg.node().__angle = 0;

  function set_transform(theta) {
    wheel.attr('transform', `rotate(${theta})`)
  }
  
  // Generic animate-to function using a D3 transition + tween
  svg.node().animate_to = function(targetDeg, {
    duration = 3500,
    ease = d3.easeCubicOut
  } = {}) {
    const node = svg.node();
    const start = node.__angle || 0;
    const end = targetDeg;

    // Interrupt any in-flight transition on the wheel
    wheel
      .interrupt()
      .transition()
      .duration(duration)
      .ease(ease)
      .tween("rotate", () => {
        const interp = d3.interpolateNumber(start, end);
        return t => set_transform(interp(t));
      })
      .on("end", () => { 
        node.__angle = end; 
        set_transform(node.__angle)
      });

    return node;
  };

  // Spin with N full turns + a random tail
  svg.node().spin = function({
    rotations = 4,               // full 360° turns
    tail = 0,                    // extra random 0..tail degrees (0 for none)
    duration = 4000,
    ease = d3.easeCubicOut
  } = {}) {
    const node = svg.node();
    const start = node.__angle || 0;
    const end = start + 360 * rotations + (tail ? Math.random() * tail : 0);
    return node.animate_to(end, { duration, ease });
  };

  // Spin so that slice i ends centered at the top (12 o'clock)
  // extraRotations adds full turns before stopping (for drama).
  svg.node().spinToIndex = function(i, {
    extraRotations = 4,
    duration = 4500,
    ease = easeBackInExpOut()
  } = {}) {
    if (i < 0 || i >= n) return svg.node();
    const node = svg.node();
    const midDeg = (arcs[i].startAngle + arcs[i].endAngle) * 90 / Math.PI;
    const target = - midDeg + 360 * extraRotations;
    const start = node.__angle || 0;
    const end = start + ((target - start) % 360 + 360) % 360 + 360 * extraRotations;
    return node.animate_to(end, { duration, ease });
  };

  return svg.node()
}
