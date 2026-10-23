// Geometry and stochastic coloring copied from @mcmcclur/penrose-three-coloring@1029.
function _triangles(S,n,dissect)
{
  let triangles = [S];
  for (let i = 0; i < n.value; i++) {
    triangles = triangles.map(dissect(i)).reduce(function (a, c) {
      return a.concat(c);
    }, []);
  }
  return triangles;
}

function _phi(){return(
(Math.sqrt(5) + 1) / 2
)}

function _S(phi){return(
{
  vertices: [[phi, 0], [phi / 2, Math.sin(Math.PI / 5)], [0, 0]],
  type: 'o'
}
)}

function _dissect(phi){return(
function dissect(i) {
  let i_dissect = function(T) {
    let T1, T2;
    let [p, q, r] = T.vertices;
    if (T.type == 'a') {
      if (i % 2 == 0) {
        let new_point = [
          (phi * q[0] + p[0]) * (2 - phi),
          (phi * q[1] + p[1]) * (2 - phi)
        ];
        T1 = {
          vertices: [r, new_point, q],
          type: 'a'
        };
        T2 = {
          vertices: [r, new_point, p],
          type: 'o'
        };
        return [T1, T2];
      } else {
        return [T];
      }
    } else if (T.type == 'o') {
      if (i % 2 == 1) {
        let new_point = [
          (phi * r[0] + p[0]) * (2 - phi),
          (phi * r[1] + p[1]) * (2 - phi)
        ];
        T1 = {
          vertices: [r, new_point, q],
          type: 'o'
        };
        T2 = {
          vertices: [p, q, new_point],
          type: 'a'
        };
        return [T1, T2];
      } else {
        return [T];
      }
    }
  };

  return i_dissect;
}
)}

function _rhombs(triangles,dist1,leftOf,d3,adjacent)
{
  // How close two points should be to be considered the same
  let tol = 0.01;

  // A list to hold all the rhombs
  let rhombs = [];

  // We'll do a double loop (certainly, this could benefit from a QuadTree).
  // i will range over all the triangles; j will range from i+1 to triangles.length
  // Of course, if j>i but already matches with a previous triangle, we can cross
  // it off our list. That's the purpose of found_indices.
  let found_indices = [];
  for (let i = 0; i < triangles.length; i++) {
    let Ti = triangles[i];
    let found = false;
    for (let j = i + 1; j < triangles.length; j++) {
      if (found_indices.indexOf(i) == -1) {
        let Tj = triangles[j];
        // Two type a's could join to form a skinny rhomb
        if (Ti.type == 'a' && Tj.type == 'a') {
          if (
            dist1(Ti.vertices[1], Tj.vertices[1]) +
              dist1(Ti.vertices[2], Tj.vertices[2]) <
            tol
          ) {
            found_indices.push(j);
            rhombs.push({
              type: 's',
              vertices: [
                Ti.vertices[2],
                Ti.vertices[0],
                Ti.vertices[1],
                Tj.vertices[0]
              ]
            });
            found = true;
            break;
          }
          // Two type o's could join to form a fat rhomb.
        } else if (Ti.type == 'o' && Tj.type == 'o') {
          if (
            dist1(Ti.vertices[0], Tj.vertices[0]) +
              dist1(Ti.vertices[2], Tj.vertices[2]) <
            tol
          ) {
            found_indices.push(j);
            rhombs.push({
              type: 'f',
              vertices: [
                Ti.vertices[2],
                Ti.vertices[1],
                Ti.vertices[0],
                Tj.vertices[1]
              ]
            });
            found = true;
            break;
          }
        }
      } else {
        found = true;
      }
    }
    // We do see some triangles on the border that would match with
    // triangles outside the border.
    if (!found) {
      rhombs.push(Ti);
    }
  }

  // Make sure that all polygons (rhombs and triangles) are positively
  // oriented. Should speed up adjacency testing later.
  rhombs.forEach(function(r, idx) {
    // r.idx = idx;
    if (
      r.type == 'a' &&
      r.vertices.filter(v => Math.abs(v[1]) < tol).length == 2
    ) {
      r.vertices.sort().reverse();
    } else if (!leftOf(...r.vertices)) {
      r.vertices.reverse();
      if (r.type == 'a') {
        let vv = r.vertices;
        r.vertices = [vv[1], vv[2], vv[0]];
      }
    }
  });

  // Use symmetry to extend the tiling. Note that a few of the triangles on the
  // bottom edge are 1/2 of a rhomb obtained after reflection.
  let bottom_half_rhombs = [];
  let upper_rhombs = [];
  rhombs.forEach(function(r) {
    let vv = r.vertices;
    // The half-rhombs are type 'o' or 'a'.
    if (r.type == 'o' || r.type == 'a') {
      // and their y-coordinates of the first and third vertices are zero
      if (Math.abs(vv[0][1]) < tol && Math.abs(vv[2][1]) < tol) {
        // if (vv.filter(v => Math.abs(v[1]) < tol).length == 2) {
        r.vertices.sort().reverse();
        r.vertices.push([vv[1][0], -vv[1][1]]);
        r.vertices = vv;
        bottom_half_rhombs.push(r);
      } else {
        // Other 'o's and 'a's are treated more easily
        upper_rhombs.push(r);
      }
    } else {
      // All the 'f's and 's's are treated more easily
      upper_rhombs.push(r);
    }
  });

  // The upper_rhombs can simply be reflected
  let new_rhombs = upper_rhombs.map(function(r) {
    let r2 = { type: r.type };
    r2.vertices = r.vertices.map(([x, y]) => [x, -y]).reverse();
    return r2;
  });
  rhombs = rhombs.concat(new_rhombs);

  // Compute centroids and prepare the neighborhood
  rhombs.forEach(function(r, idx) {
    r.idx = idx;
    let x0 = d3.mean(r.vertices.map(d => d[0]));
    let y0 = d3.mean(r.vertices.map(d => d[1]));
    r.centroid = [x0, y0];
    r.neighbors = [];
    r.color = Math.floor(d3.randomUniform(3)());
  });

  // Compute adjacencies
  for (let i = 0; i < rhombs.length; i++) {
    let p1 = rhombs[i].vertices;
    for (let j = i + 1; j < rhombs.length; j++) {
      let p2 = rhombs[j].vertices;
      if (adjacent(p1, p2)) {
        rhombs[i].neighbors.push(j);
        rhombs[j].neighbors.push(i);
      }
    }
  }

  return rhombs;
}

function _recolor(rhombs,d3,norm1){return(
function recolor(r) {
  let neighbors = r.neighbors.map(i => rhombs[i]);
  let current_color = r.color;
  if (neighbors.map((d) => d.color).indexOf(current_color) == -1) {
    return current_color;
  }

  let color_choices, new_color;
  if (current_color == 0) {
    color_choices = [1, 2];
  } else if (current_color == 1) {
    color_choices = [0, 2];
  } else if (current_color == 2) {
    color_choices = [0, 1];
  }
  let choice = d3.randomUniform()();

  let rnorm = norm1(r.centroid);
  let smaller_neighbors = neighbors.filter((r2) => norm1(r2.centroid) < rnorm);
  if (smaller_neighbors.map((d) => d.color).indexOf(current_color) > -1) {
    if (choice < 0.45) {
      new_color = color_choices[0];
    } else if (choice < 0.9) {
      new_color = color_choices[1];
    } else {
      new_color = current_color;
    }
  } else {
    if (choice < 0.05) {
      new_color = color_choices[0];
    } else if (choice < 0.1) {
      new_color = color_choices[1];
    } else {
      new_color = current_color;
    }
  }
  return new_color;
}
)}

function _check_three_color(rhombs){return(
function check_three_color(colors) {
  for (let i = 0; i < colors.length; i++) {
    if (
      rhombs[i].neighbors.map(d => rhombs[d].color).indexOf(rhombs[i].color) >
      -1
    ) {
      return false;
    }
  }
  return true;
}
)}

function _color(){return(
function color(c) {
  if (c == 0) {
    return "#e41a1c";
  } else if (c == 1) {
    return "#377eb8";
  } else {
    return "#ffff33";
  }
}
)}

function _dist1(){return(
function dist1(point1, point2) {
  let [a1, b1] = point1;
  let [a2, b2] = point2;
  return Math.abs(a1 - a2) + Math.abs(b1 - b2);
}
)}

function _norm1(){return(
function norm1(p) {
  return Math.abs(p[0]) + Math.abs(p[1]);
}
)}

function _leftOf(){return(
function leftOf([x0, y0], [x1, y1], [x, y]) {
  return x1 * (y - y0) + x * (y0 - y1) + x0 * (y1 - y) > 0;
}
)}

function _adjacent(dist1){return(
function adjacent(p1, p2) {
  let tol = 0.01;
  for (let i = 0; i < p1.length; i++) {
    for (let j = p2.length; j > 0; j--) {
      if (
        dist1(p1[i], p2[j % p2.length]) +
          dist1(p1[(i + 1) % p1.length], p2[j - 1]) <
        tol
      ) {
        return true;
      }
    }
  }
  return false;
}
)}

export function buildGeometry(n) {
  const d3 = {mean: a => a.reduce((s,x) => s+x, 0)/a.length,
    randomUniform: (max=1) => () => Math.random()*max};
  const phi = _phi(), dist = _dist1();
  return _rhombs(_triangles(_S(phi), {value:n}, _dissect(phi)), dist, _leftOf(), d3, _adjacent(dist));
}
export function coloring(rhombs) {
  const recolor = _recolor(rhombs, {randomUniform: () => Math.random}, _norm1());
  return {recolor, valid: _check_three_color(rhombs), color: _color()};
}
