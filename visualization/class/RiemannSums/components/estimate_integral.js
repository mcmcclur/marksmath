import {
  range,
  sum,
  format
} from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
const d3 = {range, sum, format}

export function compute_sum(example, N, type) {
  const dx = (example.b - example.a) / N;
  const xs = d3.range(example.a, example.b - dx/2, dx);
  let result
  if(type == "Left") {
    result = d3.sum(xs.map(x => example.f(x)*dx))
  }
  else if(type == "Right") {
    result = d3.sum(xs.map(x => example.f(x+dx)*dx))
  }
  else if(type == "Midpoint") {
    result = d3.sum(xs.map(x => example.f((x+x+dx)/2)*dx))
  }
  else if(type == "Trapezoidal") {
    result = d3.sum(xs.map(x => (example.f(x) + example.f(x+dx))*dx/2))
  }
  return result
}
