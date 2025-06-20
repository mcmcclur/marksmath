class Interval {
  constructor(a, b, depth) {
    this.a = a;
    this.b = b;
    this.depth = depth;
  }
}

function test(f, I, opts = {}) {
  let { angle_tolerance = 0.01, check_roots = false } = opts;
  let a = I.a;
  let b = I.b;
  let dx2 = (b - a) / 2;
  let m = (a + b) / 2;
  let fm = f(m);
  I.midpoint = m;
  I.f_mid = fm;
  if (check_roots && Math.sign(I.fa) != Math.sign(I.fb)) {
    return true;
  }
  let alpha = Math.atan((I.f_mid - I.fa) / dx2);
  let beta = Math.atan((I.fb - I.f_mid) / dx2);
  return Math.abs(alpha - beta) > angle_tolerance;
}

// The main function
// This function breaks the initial interval into N subintervals.
// It then checks the value at the midpoint of each subinterval.
// If the angle between the two segments formed by approximating
// the function over the first half and the second half is greater
// than 0.01 radians, then the interval is subdivided.
// Proceed recursively up to max_depth.

export function build_samples(f, a, b, opts = {}) {
  let { N = 9, max_depth = 6 } = opts;
  let dx = (b - a) / N;
  let root_intervals = Array.from({ length: N }).map(
    (_, i) => new Interval(a + i * dx, a + (i + 1) * dx, 0)
  );
  root_intervals.forEach((I) => {
    I.fa = f(I.a);
    I.fb = f(I.b);
  });
  root_intervals.reverse();

  let stack = root_intervals;
  let cnt = 0;
  let pts = [];
  let nodeRight, nodeLeft;
  while (stack.length > 0 && cnt++ < 100000) {
    let node = stack.pop();
    if (test(f, node, opts)) {
      let midpoint = node.midpoint;
      let new_depth = node.depth + 1;
      if (new_depth <= max_depth) {
        let a_left = node.a;
        let b_left = midpoint;
        nodeLeft = new Interval(a_left, b_left, new_depth);
        nodeLeft.fa = f(a_left);
        nodeLeft.fb = f(b_left);
        node.left = nodeLeft;

        let a_right = midpoint;
        let b_right = node.b;
        nodeRight = new Interval(a_right, b_right, new_depth);
        nodeRight.fa = f(a_left);
        nodeRight.fb = f(b_left);
        node.right = nodeRight;

        stack.push(nodeRight);
        stack.push(nodeLeft);
      } else {
        pts.push(node.a);
      }
    } else {
      pts.push(node.a);
    }
  }
  pts.push(b);
  //  pts = pts.map(x => ({ x: x, y: f(x) }));
  pts = pts.map((x) => [x, f(x)]);

  if (opts.show_roots) {
    let function_roots = [];
    pts.forEach(function (o, i) {
      if (i < pts.length - 1 && Math.sign(o.y) != Math.sign(pts[i + 1].y)) {
        function_roots.push((o.x + pts[i + 1].x) / 2);
      }
    });
    pts.function_roots = function_roots;
  }
  return pts;
}
