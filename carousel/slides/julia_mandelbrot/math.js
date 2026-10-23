// Copied from @mcmcclur/julia-sets-and-the-mandelbrot-set.
export function mandelbrot_iteration_count(cre, cim, bail = 100) {
  let x = cre;
  let y = cim;
  let xtemp;
  let ytemp;
  let cnt = 0;
  while (x * x + y * y <= 4 && ++cnt < bail) {
    xtemp = x;
    ytemp = y;
    x = xtemp * xtemp - ytemp * ytemp + cre;
    y = 2 * xtemp * ytemp + cim;
  }
  return cnt;
}

export function julia_iteration_count(cre, cim, x0, y0, bail) {
  let x = x0;
  let y = y0;
  let xtemp;
  let ytemp;
  let cnt = 0;
  while (x * x + y * y <= 4 && ++cnt < bail) {
    xtemp = x;
    ytemp = y;
    x = xtemp * xtemp - ytemp * ytemp + cre;
    y = 2 * xtemp * ytemp + cim;
  }
  return cnt;
}

export function f(c, z) {
  let cx = c[0];
  let cy = c[1];
  let x = z[0];
  let y = z[1];
  return [x * x - y * y + cx, 2 * x * y + cy];
}

export function compute_orbit(c, z0) {
  let z = z0;
  let orbit = [z0];
  let cnt = 0;
  while (z[0] * z[0] + z[1] * z[1] < 20 && cnt < 500) {
    z = f(c, z);
    orbit.push(z);
    cnt = cnt + 1;
  }
  return orbit;
}

export function ij_to_xy(ij, xmin, xmax, ymin, ymax, w) {
  return [
    ((xmax - xmin) / (w - 1)) * ij[0] + xmin,
    ((ymin - ymax) / (w - 1)) * ij[1] + ymax
  ];
}

export function xy_to_ij(xy, xmin, xmax, ymin, ymax, w) {
  return [
    ((w - 1) * (xy[0] - xmin)) / (xmax - xmin),
    ((1 - w) * (xy[1] - ymax)) / (ymax - ymin)
  ];
}
