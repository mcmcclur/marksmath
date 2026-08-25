import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { create, all } from "https://esm.sh/mathjs";

const math = create(all);

const vertexShader = `#version 300 es
precision highp float;
layout(location=0) in vec2 parameter;

uniform vec2 xDomain;
uniform vec2 yDomain;

out float colorValue;

#define PI 3.141592653589793
#define TAU 6.283185307179586

vec2 cconj(vec2 z) { return vec2(z.x,-z.y); }

vec2 cmul(vec2 a, vec2 b) {
  return vec2(
    a.x*b.x-a.y*b.y,
    a.x*b.y+a.y*b.x
  );
}

vec2 cdiv(vec2 a, vec2 b) {
  return vec2(
    a.x*b.x+a.y*b.y,
    a.y*b.x-a.x*b.y
  )/dot(b,b);
}

vec2 cinv(vec2 z) {
  return cconj(z)/dot(z,z);
}

vec2 csqr(vec2 z) {
  return vec2(
    z.x*z.x-z.y*z.y,
    2.0*z.x*z.y
  );
}

vec2 cexp(vec2 z) {
  float e = exp(z.x);
  return e*vec2(cos(z.y),sin(z.y));
}

vec2 clog(vec2 z) {
  return vec2(
    0.5*log(dot(z,z)),
    atan(z.y,z.x)
  );
}

vec2 cpow(vec2 a, vec2 b) {
  return cexp(cmul(b,clog(a)));
}

vec2 cpow(vec2 a, float b) {
  return cexp(clog(a)*b);
}

vec2 cpow(vec2 z, int p) {
  if (p == 0) return vec2(1,0);
  vec2 nz = z;
  for (int i=1;i<p;i++) nz = cmul(nz,z);
  return nz;
}

vec2 csqrt(vec2 a) {
  float r = length(a);
  float re = sqrt(0.5*(r+a.x));
  float im = sqrt(0.5*(r-a.x));
  return vec2(re,a.y<0.0?-im:im);
}

float carg(vec2 a) { return atan(a.y,a.x); }
float cabs(vec2 a) { return length(a); }

vec2 csin(vec2 a) { return vec2(sin(a.x)*cosh(a.y), cos(a.x)*sinh(a.y)); }
vec2 ccos(vec2 a) { return vec2(cos(a.x)*cosh(a.y),-sin(a.x)*sinh(a.y)); }
vec2 ctan(vec2 a) { return cdiv(csin(a),ccos(a)); }
vec2 ccot(vec2 a) { return cdiv(ccos(a),csin(a)); }
vec2 csinh(vec2 a) { return vec2(sinh(a.x)*cos(a.y),cosh(a.x)*sin(a.y)); }
vec2 ccosh(vec2 a) { return vec2(cosh(a.x)*cos(a.y),sinh(a.x)*sin(a.y)); }
vec2 ctanh(vec2 a) { return cdiv(csinh(a),ccosh(a)); }
vec2 ccoth(vec2 a) { return cdiv(ccosh(a),csinh(a)); }

vec2 casin(vec2 z) {
  return cmul(vec2(0,-1),clog(cmul(vec2(0,1),z)+csqrt(vec2(1,0)-csqr(z))));
}

vec2 cacos(vec2 z) {
  return vec2(1.5707963267948966,0)-casin(z);
}

vec2 catan(vec2 z) {
  vec2 iz = cmul(vec2(0,1),z);
  return 0.5*cmul(
    vec2(0,-1),
    clog(cdiv(
      vec2(1,0)+iz,
      vec2(1,0)-iz
    ))
  );
}

vec2 cacot(vec2 z) {
  return catan(cinv(z));
}

vec2 casinh(vec2 z) {
  return clog(z+csqrt(csqr(z)+vec2(1,0)));
}

vec2 cacosh(vec2 z) {
  return clog(
    z+cmul(
      csqrt(z+vec2(1,0)),
      csqrt(z-vec2(1,0))
    )
  );
}

vec2 catanh(vec2 z) {
  return 0.5*clog(cdiv(vec2(1,0)+z,vec2(1,0)-z));
}

vec2 cacoth(vec2 z) {
  return 0.5*clog(cdiv(z+vec2(1,0),z-vec2(1,0)));
}

//--f--//

//--parameter-to-z--//

void main() {
  vec2 z = parameterToZ(parameter);
  vec2 w = f(z);
  vec2 scaled = vec2(
    (w.x - xDomain.x)/(xDomain.y - xDomain.x),
    (w.y - yDomain.x)/(yDomain.y - yDomain.x)
  );

  if (any(isnan(w)) || any(isinf(w))) {
    gl_Position = vec4(3,3,0,1);
  } else {
    gl_Position = vec4(2.0*scaled - 1.0, 0, 1);
  }

  colorValue = parameter.x;
}`;

const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 colorDomain;
uniform vec4 lineColor;
uniform float opacity;
uniform int style;

in float colorValue;
out vec4 fragColor;

vec3 turbo(float x) {
  x = clamp(x, 0.0, 1.0);
  vec4 kRed = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
  vec4 kGreen = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
  vec4 kBlue = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
  vec2 kRed2 = vec2(-152.94239396, 59.28637943);
  vec2 kGreen2 = vec2(4.27729857, 2.82956604);
  vec2 kBlue2 = vec2(-89.90310912, 27.34824973);
  vec4 v4 = vec4(1.0, x, x*x, x*x*x);
  vec2 v2 = v4.zw * v4.z;
  return vec3(
    dot(v4, kRed) + dot(v2, kRed2),
    dot(v4, kGreen) + dot(v2, kGreen2),
    dot(v4, kBlue) + dot(v2, kBlue2)
  );
}

void main() {
  if (style == 1) {
    fragColor = lineColor;
    return;
  }

  float t = (colorValue - colorDomain.x)/(colorDomain.y - colorDomain.x);
  fragColor = vec4(turbo(t), opacity);
}`;

let glResources;

function getGLResources() {
  if (glResources) {
    return glResources;
  }

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    antialias: true
  });

  if (!gl) {
    throw new Error("WebGL2 not supported");
  }

  glResources = { canvas, gl };
  return glResources;
}

function makeShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader).replace(/\0+$/, "");
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function makeProgram(gl, source) {
  const vertex = makeShader(gl, gl.VERTEX_SHADER, source.vertex);
  const fragment = makeShader(gl, gl.FRAGMENT_SHADER, source.fragment);
  const program = gl.createProgram();

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program).replace(/\0+$/, "");
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

const parameterToZ = {
  cartesian: `vec2 parameterToZ(vec2 parameter) {
  return parameter;
}`,
  polar: `vec2 parameterToZ(vec2 parameter) {
  return parameter.x*vec2(cos(parameter.y), sin(parameter.y));
}`
};

class ComplexImageMark extends Plot.Mark {
  constructor({
    fString,
    parameterType,
    uDomain,
    vDomain,
    samples,
    uSamples,
    vSamples,
    gridLines,
    lineSamples,
    pixelRatio,
    outputPadding,
    xDomain,
    yDomain,
    opacity,
    lineColor,
    grid,
    rest
  }) {
    const boundsData = outputBoundsData(fString, parameterType, uDomain, vDomain, {
      samples,
      xDomain,
      yDomain,
      outputPadding
    });

    super(boundsData, {
      x: { value: "x", scale: "x" },
      y: { value: "y", scale: "y" }
    }, rest);

    const { gl } = getGLResources();
    const f = expressionToFunction(fString);
    const source = {
      vertex: vertexShader
        .replace("//--f--//", f)
        .replace("//--parameter-to-z--//", parameterToZ[parameterType]),
      fragment: fragmentShader
    };

    this.program = makeProgram(gl, source);
    this.fillBuffer = gl.createBuffer();
    this.lineBuffer = gl.createBuffer();
    this.fillVertexCount = 0;
    this.lineRuns = [];
    this.canvas2 = document.createElement("canvas");
    this.ctx = this.canvas2.getContext("2d");
    this.pixelRatio = pixelRatio;
    this.fallbackXDomain = boundsExtent(boundsData, "x");
    this.fallbackYDomain = boundsExtent(boundsData, "y");
    this.colorDomain = uDomain;
    this.opacity = opacity;
    this.lineColor = lineColor;
    this.grid = grid;

    const fillVertices = makeTriangleMesh(uDomain, vDomain, uSamples, vSamples);
    this.fillVertexCount = fillVertices.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fillBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fillVertices, gl.STATIC_DRAW);

    const lineData = makeGridLines(uDomain, vDomain, gridLines, lineSamples);
    this.lineRuns = lineData.runs;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineData.vertices, gl.STATIC_DRAW);
  }

  render(_index, scales, _values, dimensions, context) {
    const { canvas, gl } = getGLResources();
    const width = dimensions.width - dimensions.marginLeft - dimensions.marginRight;
    const height = dimensions.height - dimensions.marginTop - dimensions.marginBottom;
    const xDomain = scales.x?.domain?.() ?? this.fallbackXDomain;
    const yDomain = scales.y?.domain?.() ?? this.fallbackYDomain;
    const sw = Math.max(1, Math.round(width * this.pixelRatio));
    const sh = Math.max(1, Math.round(height * this.pixelRatio));

    if (canvas.width !== sw) canvas.width = sw;
    if (canvas.height !== sh) canvas.height = sh;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(gl.getUniformLocation(this.program, "xDomain"), xDomain[0], xDomain[1]);
    gl.uniform2f(gl.getUniformLocation(this.program, "yDomain"), yDomain[0], yDomain[1]);
    gl.uniform2f(gl.getUniformLocation(this.program, "colorDomain"), this.colorDomain[0], this.colorDomain[1]);
    gl.uniform1f(gl.getUniformLocation(this.program, "opacity"), this.opacity);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1i(gl.getUniformLocation(this.program, "style"), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fillBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.fillVertexCount);

    if (this.grid && this.lineRuns.length > 0) {
      gl.uniform1i(gl.getUniformLocation(this.program, "style"), 1);
      gl.uniform4fv(gl.getUniformLocation(this.program, "lineColor"), this.lineColor);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const run of this.lineRuns) {
        gl.drawArrays(gl.LINE_STRIP, run.start, run.count);
      }
    }

    context?.invalidation?.then(() => {
      gl.deleteProgram(this.program);
      gl.deleteBuffer(this.fillBuffer);
      gl.deleteBuffer(this.lineBuffer);
    });

    if (this.canvas2.width !== canvas.width) this.canvas2.width = canvas.width;
    if (this.canvas2.height !== canvas.height) this.canvas2.height = canvas.height;
    this.ctx.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
    this.ctx.drawImage(canvas, 0, 0);

    const NS = "http://www.w3.org/2000/svg";
    const fo = document.createElementNS(NS, "foreignObject");
    fo.setAttribute("width", width);
    fo.setAttribute("height", height);
    this.canvas2.style.width = `${width}px`;
    this.canvas2.style.height = `${height}px`;
    fo.appendChild(this.canvas2);

    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${dimensions.marginLeft},${dimensions.marginTop})`);
    g.appendChild(fo);

    return g;
  }
}

export function complexCartesianMark(fString, [a, b], [c, d], options = {}) {
  const {
    samples = 80,
    xSamples = 220,
    ySamples = 220,
    gridLines = 10,
    lineSamples = 240,
    pixelRatio = Math.max(globalThis.devicePixelRatio ?? 1, 2),
    outputPadding = 0.04,
    xDomain,
    yDomain,
    opacity = 0.95,
    lineColor = [0, 0, 0, 0.4],
    grid = true,
    ...rest
  } = options;

  return new ComplexImageMark({
    fString,
    parameterType: "cartesian",
    uDomain: [a, b],
    vDomain: [c, d],
    samples,
    uSamples: xSamples,
    vSamples: ySamples,
    gridLines,
    lineSamples,
    pixelRatio,
    outputPadding,
    xDomain,
    yDomain,
    opacity,
    lineColor,
    grid,
    rest
  });
}

export function complexCartesianPlot(fString, xRange, yRange, options = {}) {
  const {
    width = 500,
    margin = 40,
    aspectRatio = 1,
    axis = true,
    ...markOptions
  } = options;

  return Plot.plot({
    width,
    margin,
    aspectRatio,
    marks: [
      complexCartesianMark(fString, xRange, yRange, markOptions),
      axis ? Plot.axisX({ y: 0 }) : null,
      axis ? Plot.axisY({ x: 0 }) : null,
      axis ? Plot.ruleX([0]) : null,
      axis ? Plot.ruleY([0]) : null
    ]
  });
}

export function complexPolarMark(fString, [a, b], [alpha, beta], options = {}) {
  const {
    samples = 80,
    rSamples = 220,
    tSamples = 220,
    gridLines = 10,
    lineSamples = 240,
    pixelRatio = Math.max(globalThis.devicePixelRatio ?? 1, 2),
    outputPadding = 0.04,
    xDomain,
    yDomain,
    opacity = 0.95,
    lineColor = [0, 0, 0, 0.4],
    grid = true,
    ...rest
  } = options;

  return new ComplexImageMark({
    fString,
    parameterType: "polar",
    uDomain: [a, b],
    vDomain: [alpha, beta],
    samples,
    uSamples: rSamples,
    vSamples: tSamples,
    gridLines,
    lineSamples,
    pixelRatio,
    outputPadding,
    xDomain,
    yDomain,
    opacity,
    lineColor,
    grid,
    rest
  });
}

export function complexPolarPlot(fString, rRange, thetaRange, options = {}) {
  const {
    width = 500,
    margin = 40,
    aspectRatio = 1,
    axis = true,
    ...markOptions
  } = options;

  return Plot.plot({
    width,
    margin,
    aspectRatio,
    marks: [
      complexPolarMark(fString, rRange, thetaRange, markOptions),
      axis ? Plot.axisX({ y: 0 }) : null,
      axis ? Plot.axisY({ x: 0 }) : null,
      axis ? Plot.ruleX([0]) : null,
      axis ? Plot.ruleY([0]) : null
    ]
  });
}

export function expressionToFunction(expr) {
  const parsed = math.parse(expr);
  const body = toComplex(toGLSL(parsed)).code;
  return `vec2 f(vec2 z) {
  return ${body};
}`;
}

function complexFunction(expr) {
  const compiled = math.parse(expr).compile();
  const i = math.complex(0, 1);
  return z => compiled.evaluate({ z, i, I: i });
}

function outputBoundsData(fString, parameterType, uDomain, vDomain, options) {
  const { samples, xDomain, yDomain, outputPadding } = options;
  if (xDomain && yDomain) {
    return [
      { x: xDomain[0], y: yDomain[0] },
      { x: xDomain[1], y: yDomain[1] }
    ];
  }

  const points = [];
  const f = complexFunction(fString);
  const uSteps = Math.max(2, samples);
  const vSteps = Math.max(2, samples);

  for (let i = 0; i < uSteps; i++) {
    const u = interpolate(uDomain, i/(uSteps - 1));
    for (let j = 0; j < vSteps; j++) {
      const v = interpolate(vDomain, j/(vSteps - 1));
      const z = parameterType === "polar"
        ? math.complex(u*Math.cos(v), u*Math.sin(v))
        : math.complex(u, v);
      const w = f(z);
      const x = Number(w?.re ?? w);
      const y = Number(w?.im ?? 0);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        points.push({ x, y });
      }
    }
  }

  const xExtent = xDomain ?? paddedExtent(points.map(d => d.x), outputPadding);
  const yExtent = yDomain ?? paddedExtent(points.map(d => d.y), outputPadding);
  return [
    { x: xExtent[0], y: yExtent[0] },
    { x: xExtent[1], y: yExtent[1] }
  ];
}

function paddedExtent(values, padding) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return [-1, 1];

  const lo = finite[Math.floor(0.01*(finite.length - 1))];
  const hi = finite[Math.ceil(0.99*(finite.length - 1))];
  const span = hi - lo;
  if (span === 0) return [lo - 1, hi + 1];

  return [lo - padding*span, hi + padding*span];
}

function boundsExtent(boundsData, key) {
  return [boundsData[0][key], boundsData[1][key]];
}

function makeTriangleMesh(uDomain, vDomain, uSamples, vSamples) {
  const vertices = [];
  const uSteps = Math.max(2, uSamples);
  const vSteps = Math.max(2, vSamples);

  for (let i = 0; i < uSteps - 1; i++) {
    const u0 = interpolate(uDomain, i/(uSteps - 1));
    const u1 = interpolate(uDomain, (i + 1)/(uSteps - 1));

    for (let j = 0; j < vSteps - 1; j++) {
      const v0 = interpolate(vDomain, j/(vSteps - 1));
      const v1 = interpolate(vDomain, (j + 1)/(vSteps - 1));
      vertices.push(
        u0, v0,
        u1, v0,
        u0, v1,
        u1, v0,
        u1, v1,
        u0, v1
      );
    }
  }

  return new Float32Array(vertices);
}

function makeGridLines(uDomain, vDomain, gridLines, lineSamples) {
  const vertices = [];
  const runs = [];
  const lines = Math.max(0, gridLines);
  const samples = Math.max(2, lineSamples);

  if (lines === 0) {
    return {
      vertices: new Float32Array(vertices),
      runs
    };
  }

  const addRun = points => {
    const start = vertices.length / 2;
    for (const [u, v] of points) {
      vertices.push(u, v);
    }
    runs.push({ start, count: points.length });
  };

  for (let i = 0; i <= lines; i++) {
    const u = interpolate(uDomain, i/lines);
    const points = [];
    for (let j = 0; j < samples; j++) {
      points.push([u, interpolate(vDomain, j/(samples - 1))]);
    }
    addRun(points);
  }

  for (let j = 0; j <= lines; j++) {
    const v = interpolate(vDomain, j/lines);
    const points = [];
    for (let i = 0; i < samples; i++) {
      points.push([interpolate(uDomain, i/(samples - 1)), v]);
    }
    addRun(points);
  }

  return {
    vertices: new Float32Array(vertices),
    runs
  };
}

function interpolate([a, b], t) {
  return a + t*(b - a);
}

function toGLSL(node) {
  if (node.isParenthesisNode) {
    return toGLSL(node.content);
  }

  if (node.isConstantNode) {
    return { type: "float", code: formatNumber(Number(node.value)) };
  }

  if (node.isSymbolNode) {
    const lowerName = node.name.toLowerCase();
    if (lowerName === "z") return { type: "complex", code: "z" };
    if (lowerName === "i") return { type: "complex", code: "vec2(0,1)" };
    if (lowerName === "pi") return { type: "float", code: "PI" };
    if (lowerName === "tau") return { type: "float", code: "TAU" };
    if (lowerName === "e") return { type: "float", code: "2.718281828459045" };
  }

  if (node.isOperatorNode) {
    return operatorToGLSL(node);
  }

  if (node.isFunctionNode) {
    return functionToGLSL(node);
  }

  throw new Error(`Cannot translate ${node.type} in "${node.toString()}" to GLSL.`);
}

function operatorToGLSL(node) {
  if (node.args.length === 1) {
    const value = toGLSL(node.args[0]);
    if (node.op === "-") return { ...value, code: `(-${value.code})` };
    if (node.op === "+") return value;
  }

  const left = toGLSL(node.args[0]);
  const right = toGLSL(node.args[1]);

  if (node.op === "+") {
    if (left.type === "float" && right.type === "float") {
      return { type: "float", code: `(${left.code}+${right.code})` };
    }
    return { type: "complex", code: `(${toComplex(left).code}+${toComplex(right).code})` };
  }

  if (node.op === "-") {
    if (left.type === "float" && right.type === "float") {
      return { type: "float", code: `(${left.code}-${right.code})` };
    }
    return { type: "complex", code: `(${toComplex(left).code}-${toComplex(right).code})` };
  }

  if (node.op === "*") {
    if (left.type === "float" && right.type === "float") {
      return { type: "float", code: `(${left.code}*${right.code})` };
    }
    if (left.type === "float") {
      return { type: "complex", code: `(${toComplex(right).code}*${left.code})` };
    }
    if (right.type === "float") {
      return { type: "complex", code: `(${toComplex(left).code}*${right.code})` };
    }
    return { type: "complex", code: `cmul(${left.code},${right.code})` };
  }

  if (node.op === "/") {
    if (left.type === "float" && right.type === "float") {
      return { type: "float", code: `(${left.code}/${right.code})` };
    }
    if (right.type === "float") {
      return { type: "complex", code: `(${toComplex(left).code}/${right.code})` };
    }
    return { type: "complex", code: `cdiv(${toComplex(left).code},${toComplex(right).code})` };
  }

  if (node.op === "^") {
    if (left.type === "float" && right.type === "float") {
      return { type: "float", code: `pow(${left.code},${right.code})` };
    }

    const integerPower = integerConstant(node.args[1]);
    if (integerPower !== null && integerPower >= 0) {
      return { type: "complex", code: `cpow(${toComplex(left).code},${integerPower})` };
    }

    if (right.type === "float") {
      return { type: "complex", code: `cpow(${toComplex(left).code},${right.code})` };
    }

    return { type: "complex", code: `cpow(${toComplex(left).code},${toComplex(right).code})` };
  }

  throw new Error(`Cannot translate operator "${node.op}" to GLSL.`);
}

function functionToGLSL(node) {
  const name = node.name.toLowerCase();
  const args = node.args.map(toGLSL);

  if (name === "complex" && args.length === 2) {
    return { type: "complex", code: `vec2(${toFloat(args[0]).code},${toFloat(args[1]).code})` };
  }

  if (["re", "real"].includes(name) && args.length === 1) {
    return { type: "float", code: `${toComplex(args[0]).code}.x` };
  }

  if (["im", "imag", "imaginary"].includes(name) && args.length === 1) {
    return { type: "float", code: `${toComplex(args[0]).code}.y` };
  }

  if (["abs", "arg"].includes(name) && args.length === 1) {
    return { type: "float", code: `c${name}(${toComplex(args[0]).code})` };
  }

  if (name === "norm" && args.length === 1) {
    const z = toComplex(args[0]).code;
    return { type: "float", code: `dot(${z},${z})` };
  }

  const complexFunctions = new Map([
    ["sqrt", "csqrt"],
    ["exp", "cexp"],
    ["log", "clog"],
    ["ln", "clog"],
    ["sin", "csin"],
    ["cos", "ccos"],
    ["tan", "ctan"],
    ["cot", "ccot"],
    ["sinh", "csinh"],
    ["cosh", "ccosh"],
    ["tanh", "ctanh"],
    ["coth", "ccoth"],
    ["asin", "casin"],
    ["acos", "cacos"],
    ["atan", "catan"],
    ["acot", "cacot"],
    ["asinh", "casinh"],
    ["acosh", "cacosh"],
    ["atanh", "catanh"],
    ["acoth", "cacoth"],
    ["conj", "cconj"]
  ]);

  if (complexFunctions.has(name) && args.length === 1) {
    return { type: "complex", code: `${complexFunctions.get(name)}(${toComplex(args[0]).code})` };
  }

  if (name === "pow" && args.length === 2) {
    return powerToGLSL(args[0], args[1], integerConstant(node.args[1]));
  }

  throw new Error(`Cannot translate function "${node.name}" to GLSL.`);
}

function powerToGLSL(left, right, integerPower) {
  if (left.type === "float" && right.type === "float") {
    return { type: "float", code: `pow(${left.code},${right.code})` };
  }

  if (integerPower !== null && integerPower >= 0) {
    return { type: "complex", code: `cpow(${toComplex(left).code},${integerPower})` };
  }

  if (right.type === "float") {
    return { type: "complex", code: `cpow(${toComplex(left).code},${right.code})` };
  }

  return { type: "complex", code: `cpow(${toComplex(left).code},${toComplex(right).code})` };
}

function toComplex(value) {
  if (value.type === "complex") return value;
  return { type: "complex", code: `vec2(${value.code},0)` };
}

function toFloat(value) {
  if (value.type === "float") return value;
  throw new Error(`Expected a real-valued expression, but found "${value.code}".`);
}

function integerConstant(node) {
  if (!node.isConstantNode) return null;
  const value = Number(node.value);
  return Number.isInteger(value) ? value : null;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    throw new Error(`Only finite numeric constants can be translated to GLSL.`);
  }

  return Number.isInteger(value) ? `${value}.0` : `${value}`;
}
