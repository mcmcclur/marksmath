// Local rendering helpers copied from @mcmcclur/x3dom-utilities.
function _string_add(){return(
function string_add(s1, s2) {
  let v2 = s2.split(' ');
  return s1.split(' ')
    .map((v, i) => parseFloat(v) + parseFloat(v2[i]))
    .join(' ');
}
)}

function _chop(){return(
function chop(x) {
  return Math.abs(x) < 0.000001 ? 0 : x;
}
)}

function _cross(){return(
function cross([x1, y1, z1], [x2, y2, z2]) {
  return [
    y1 * z2 - z1 * y2,
    z1 * x2 - x1 * z2,
    x1 * y2 - y1 * x2
  ];
}
)}

function _dot(){return(
function dot([x1, y1, z1], [x2, y2, z2]) {
  return x1 * x2 + y1 * y2 + z1 * z2;
}
)}

function _diff(){return(
function diff([x1, y1, z1], [x2, y2, z2]) {
  return [x2 - x1, y2 - y1, z2 - z1];
}
)}

function _sum(){return(
function sum([x1, y1, z1], [x2, y2, z2]) {
  return [x2 + x1, y2 + y1, z2 + z1];
}
)}

function _negate(){return(
function negate([x, y, z]) {
  return [-x, -y, -z];
}
)}

function _norm(){return(
function norm([v0, v1, v2]) {
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
)}

function _normalize(norm){return(
function normalize(v) {
  let [x, y, z] = v;
  let n = norm(v);
  return [x / n, y / n, z / n];
}
)}

function _scale(){return(
function scale(r, [x, y, z]) {
  return [r * x, r * y, r * z];
}
)}

function _pt_toString(){return(
function pt_toString([x, y, z]) {
  return ` ${x} ${y} ${z}`;
}
)}

function _path_list_to_indexString(d3){return(
function path_list_to_indexString(paths) {
  let cnt = 0;
  let individual_indices = paths.map(function(l) {
    let result = d3.range(l.length).map(x => x + cnt);
    cnt = cnt + l.length;
    return result.toString();
  });
  return individual_indices
    .map(s => s + ' -1')
    .toString()
    .replace(/,/g, ' ');
}
)}

function _pt_list_to_colorString(pt_toString){return(
function pt_list_to_colorString(pt_list,f) {
  return pt_list.map(pt_toString).toString();
}
)}

function _pt_list_to_coordString(pt_toString){return(
function pt_list_to_coordString(pt_list) {
  return pt_list.map(pt_toString).toString();
}
)}

function _path_list_to_coordString(pt_list_to_coordString){return(
function path_list_to_coordString(paths) {
  return paths.map(pt_list_to_coordString).toString();
}
)}

function _rotation_vector(normalize,cross,dot){return(
function rotation_vector(u1, v1) {
  let u = normalize(u1);
  let v = normalize(v1);
  let n = cross(u, v);
  let t = Math.acos(dot(u, v));
  return `${n[0]} ${n[1]} ${n[2]} ${t}`;
}
)}

function _normal_binormal(normalize,cross){return(
function normal_binormal(d) {
  const [x, y, z] = d;
  let n; // normal
  if (x && y) n = normalize([-y, x, 0]);
  else if (x && z) n = normalize([-z, 0, x]);
  else if (y && z) n = normalize([0, -z, y]);
  if(n !== undefined) {
    return [n, normalize(cross(n, d))];
  }
  if (x) return [[0, 1, 0], [0, 0, 1]];
  if (y) return [[1, 0, 0], [0, 0, 1]];
  if (z) return [[1, 0, 0], [0, 1, 0]];
  return [undefined, undefined];
}
)}

function _rotation_matrix(normalize,cross,math){return(
function rotation_matrix(d, t) {
  let c1, c2, c3;
  let rotateX = (t) => [
    [1, 0, 0],
    [0, Math.cos(t), -Math.sin(t)],
    [0, Math.sin(t), Math.cos(t)]
  ];
  if (d[1] == 0 && d[2] == 0) {
    return rotateX(t);
  } else {
    c1 = normalize(d);
    c2 = normalize(cross(d, [1, 0, 0]));
    c3 = cross(c1, c2);
    let S = [
      [c1[0], c2[0], c3[0]],
      [c1[1], c2[1], c3[1]],
      [c1[2], c2[2], c3[2]]
    ];
    let result = math.multiply(S, rotateX(t), math.inv(S));
    return result;
  }
}
)}

function _d3(require){return(
require('d3-array@2')
)}

function _math(require){return(
require("mathjs")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("string_add")).define("string_add", _string_add);
  main.variable(observer("chop")).define("chop", _chop);
  main.variable(observer("cross")).define("cross", _cross);
  main.variable(observer("dot")).define("dot", _dot);
  main.variable(observer("diff")).define("diff", _diff);
  main.variable(observer("sum")).define("sum", _sum);
  main.variable(observer("negate")).define("negate", _negate);
  main.variable(observer("norm")).define("norm", _norm);
  main.variable(observer("normalize")).define("normalize", ["norm"], _normalize);
  main.variable(observer("scale")).define("scale", _scale);
  main.variable(observer("pt_toString")).define("pt_toString", _pt_toString);
  main.variable(observer("path_list_to_indexString")).define("path_list_to_indexString", ["d3"], _path_list_to_indexString);
  main.variable(observer("pt_list_to_colorString")).define("pt_list_to_colorString", ["pt_toString"], _pt_list_to_colorString);
  main.variable(observer("pt_list_to_coordString")).define("pt_list_to_coordString", ["pt_toString"], _pt_list_to_coordString);
  main.variable(observer("path_list_to_coordString")).define("path_list_to_coordString", ["pt_list_to_coordString"], _path_list_to_coordString);
  main.variable(observer("rotation_vector")).define("rotation_vector", ["normalize","cross","dot"], _rotation_vector);
  main.variable(observer("normal_binormal")).define("normal_binormal", ["normalize","cross"], _normal_binormal);
  main.variable(observer("rotation_matrix")).define("rotation_matrix", ["normalize","cross","math"], _rotation_matrix);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("math")).define("math", ["require"], _math);
  return main;
}
