// From Ricky Reusser's Observable Notebook:
// https://observablehq.com/@rreusser/integration

var MAX_PERMITTED_DEPTH = 30;
var Sri = new Float64Array(MAX_PERMITTED_DEPTH);
var Sli = new Float64Array(MAX_PERMITTED_DEPTH);
var fbi = new Float64Array(MAX_PERMITTED_DEPTH);
var bi = new Float64Array(MAX_PERMITTED_DEPTH);
var frmi = new Float64Array(MAX_PERMITTED_DEPTH);

export function adaptiveSimpson(f, a, b, tolerance, maxDepth, minDepth) {
  if (typeof tolerance !== null && typeof tolerance === 'object') {
    minDepth = tolerance.minDepth;
    maxDepth = tolerance.maxDepth;
    tolerance = tolerance.tolerance;
  }
  tolerance = typeof tolerance === "undefined" ? 1e-11 : tolerance;
  maxDepth = typeof maxDepth === "undefined" ? 8 : maxDepth;
  minDepth = typeof minDepth === "undefined" ? 0 : minDepth;

  if (maxDepth > MAX_PERMITTED_DEPTH) {
    throw new Error(
      'Max depth (' +
        maxDepth +
        ') is greater than the maximum permitted depth of ' +
        MAX_PERMITTED_DEPTH
    );
  }
  if (minDepth < 0 || minDepth > MAX_PERMITTED_DEPTH) {
    throw new Error(
      'Min depth (' +
        minDepth +
        ') must be an integer between 0 and ' +
        MAX_PERMITTED_DEPTH
    );
  }

  var left, right, delta, lm, rm, flm, frm;

  // Initialize the position information. Our bitwise scheme works
  // like this: position indicates the x position in terms of an
  // integer from 0 to 2^maxDepth. Each bit can also be interpreted
  // as indicating whether we're currently on the left or right side
  // of the binary branch at the corresponding level.
  var level = maxDepth;
  var depthBit = 1;
  var position;

  var h0 = b - a;
  if (h0 === 0) return 0;
  var m = 0.5 * (b + a);
  var a0 = a;
  var h6 = (b - a) / 6;
  var res = h0 / (1 << maxDepth);
  var fa = f(a);
  var fm = f(m);
  var fb = f(b);
  var S = h6 * (fa + 4 * fm + fb);

  // We only ever compare against 15 * epsilon, so just premultiply
  tolerance *= 15;

  // The layout of points is:
  //     a    m    b
  //       lm   rm
  // We start at level = maxDepth which is the coarsest, then step
  // down into progressively finer levels.
  while (true) {
    h6 = (b - a) * (0.5 / 6);
    lm = 0.5 * (a + m);
    rm = 0.5 * (m + b);
    flm = f(lm);
    frm = f(rm);
    left = h6 * (fa + 4 * flm + fm);
    right = h6 * (fm + 4 * frm + fb);
    delta = left + right - S;

    // Are we at the finest level (level = 0)? Or did we otherwise meet our
    // tolerance? If so, then aggregate information and step back up to
    // coarser levels.
    if (
      level === 0 ||
      (level <= maxDepth - minDepth &&
        Math.abs(delta) * depthBit <= tolerance)
    ) {
      var sum = left + right + delta * 0.066666666666666667;

      // If we're not recursing down, either because we're at the finest level
      // (level = 0) or because the tolerance is met, then this section is an
      // aggregation of the values we computed before with a value we've just
      // computed. We exit this loop as soon as we can step right rather than
      // continuing to aggregate upward.
      while (true) {
        // Are we already on the right side of a split? If so, then aggregate, step
        // up, and then break out of this loop.
        if (position & (1 << level)) {
          // Step up
          position ^= 1 << level;
          depthBit >>>= 1;
          sum += Sli[level];
          level++;
          fb = fbi[level];
          fm = fb;
          m = b;
          b = bi[level];
          continue;
        }

        // The left side of the entire range is just the range itself, [a, b].
        // In this special case we're on the *right* side of this range (there
        // isn't one), which means we've completed the computation and can
        // return the result.
        if (level === maxDepth) return sum;

        // The remainder of this section steps right. That is, we compute a
        // left and right sum and compare it to a coarser sum over the same
        // range. The comparision indicates whether our tolerance is met or
        // not.
        position ^= 1 << level;

        // Update the bounds of the left/right bounds of the current range
        a = b;
        //b = a0 + res * (position + (1 << level))
        fa = fb;
        // Restore from values we computed on the way down
        b = bi[level + 1];
        fb = fbi[level + 1];
        fm = frmi[level + 1];
        S = Sri[level + 1];
        m = 0.5 * (a + b);
        // Store the sum for aggregation on the way back up
        Sli[level] = sum;
        break;
      }
      continue;
    }

    // Step down to a finer level (toward level = 0). Also store values for
    // aggregation on the way back up.
    bi[level] = b;
    fbi[level] = fb;
    Sri[level] = right;
    frmi[level] = frm;
    depthBit <<= 1;
    level--;
    b = m;
    m = lm;
    fb = fm;
    fm = flm;
    S = left;
  }
}
