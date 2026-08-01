// Draws a groovy interactive complex plot of
// (z^3-1)/(z-(a+bi))
// where a and b are chosen by mouse position.
// 
// Domain coloring code taken from
// https://observablehq.com/@nxrix/domain-coloring


import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const parameterDomain = {
  x: [-2.3, 2.3],
  y: [-2.3, 2.3]
};

export function funPic(a, b, divID) {
  const divNode = document.getElementById(divID);
  if (!divNode) {
    return null;
  }

  const size = getPlotSize(divNode);
  const plot = Plot.plot({
    width: size,
    height: size,
    margin: 0,
    x: { axis: null, domain: parameterDomain.x },
    y: { axis: null, domain: parameterDomain.y },
    marks: [
      complexMark(`vec2 f(vec2 z) {
        return cdiv(cpow(z,3)-vec2(1,0), cpow(z-vec2(${a},${b}),2));
      }`),
      Plot.frame()
    ]
  });

  plot.classList.add("complex-plot-picture");
  divNode.replaceChildren(plot);
  return plot;
}

export function interactiveFunPic(divID, options = {}) {
  const divNode = document.getElementById(divID);
  if (!divNode) {
    return null;
  }

  divNode.__interactiveFunPicCleanup?.();

  const {
    initial = { a: 0, b: 0 },
    transitionDuration = 500
  } = options;

  let current = initial;
  let animationFrame = null;
  let transitionFrame = null;
  let transitionStart = 0;
  let transitionFrom = current;
  let transitionTo = current;
  let resizeObserver = null;

  const draw = ({ a, b }) => {
    current = { a, b };
    funPic(a, b, divID);
  };

  const queueDraw = (point) => {
    current = point;
    if (animationFrame !== null) {
      return;
    }

    animationFrame = globalThis.requestAnimationFrame(() => {
      animationFrame = null;
      draw(current);
    });
  };

  const stopTransition = () => {
    if (transitionFrame !== null) {
      globalThis.cancelAnimationFrame(transitionFrame);
      transitionFrame = null;
    }
  };

  const pointFromEvent = (event) => {
    const rect = getPlotRect(divNode);
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    return {
      a: parameterDomain.x[0] + x * (parameterDomain.x[1] - parameterDomain.x[0]),
      b: parameterDomain.y[1] - y * (parameterDomain.y[1] - parameterDomain.y[0])
    };
  };

  const tickTransition = (timestamp) => {
    const t = clamp((timestamp - transitionStart) / transitionDuration);
    queueDraw({
      a: (1 - t) * transitionFrom.a + t * transitionTo.a,
      b: (1 - t) * transitionFrom.b + t * transitionTo.b
    });

    if (t < 1) {
      transitionFrame = globalThis.requestAnimationFrame(tickTransition);
    } else {
      transitionFrame = null;
    }
  };

  const onPointerMove = (event) => {
    stopTransition();
    queueDraw(pointFromEvent(event));
  };

  const onPointerEnter = (event) => {
    stopTransition();
    queueDraw(pointFromEvent(event));
  };

  const onPointerLeave = () => {
    stopTransition();
    transitionFrom = current;
    transitionTo = randomParameter();
    transitionStart = performance.now();
    transitionFrame = globalThis.requestAnimationFrame(tickTransition);
  };

  draw(current);
  divNode.addEventListener("pointerenter", onPointerEnter);
  divNode.addEventListener("pointermove", onPointerMove);
  divNode.addEventListener("pointerleave", onPointerLeave);

  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(() => {
      queueDraw(current);
    });
    resizeObserver.observe(divNode);
  }

  const cleanup = () => {
    if (animationFrame !== null) {
      globalThis.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    stopTransition();
    divNode.removeEventListener("pointerenter", onPointerEnter);
    divNode.removeEventListener("pointermove", onPointerMove);
    divNode.removeEventListener("pointerleave", onPointerLeave);
    resizeObserver?.disconnect();
    delete divNode.__interactiveFunPicCleanup;
  };

  divNode.__interactiveFunPicCleanup = cleanup;
  return cleanup;
}

function randomParameter() {
  return {
    a: parameterDomain.x[0] + Math.random() * (parameterDomain.x[1] - parameterDomain.x[0]),
    b: parameterDomain.y[0] + Math.random() * (parameterDomain.y[1] - parameterDomain.y[0])
  };
}

function getPlotSize(divNode) {
  const measuredWidth = divNode.getBoundingClientRect().width;
  if (measuredWidth > 0) {
    return Math.round(measuredWidth);
  }

  const parentWidth = divNode.parentElement?.getBoundingClientRect?.().width ?? 0;
  return Math.round(Math.max(parentWidth, 300));
}

function getPlotRect(divNode) {
  const plotNode = divNode.querySelector(".complex-plot-picture");
  const rect = plotNode?.getBoundingClientRect?.();
  if (rect?.width > 0 && rect?.height > 0) {
    return rect;
  }

  return divNode.getBoundingClientRect();
}


// Everything below here taken from 
// https://observablehq.com/@nxrix/domain-coloring
// with only slight modifications
const vs = `#version 300 es\nlayout(location=0) in vec2 p;\nvoid main() { gl_Position = vec4(p,0,1); }`;
const fs = `#version 300 es
precision highp float;
uniform vec4 iD;
uniform vec2 iR;
out vec4 fragColor;
#define  PI 3.14159265358979
#define TAU 6.28318530717959

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

vec3 oklab2rgb(vec3 c) {
  vec3 lms = c.x+
    c.y*vec3(0.3963377774,-0.1055613458,-0.0894841775)+
    c.z*vec3(0.2158037573,-0.0638541728,-1.2914855480);
  lms = lms*lms*lms;
  vec3 r = clamp(vec3(
     4.0767416621*lms.x-3.3077115913*lms.y+0.2309699292*lms.z,
    -1.2684380046*lms.x+2.6097574011*lms.y-0.3413193965*lms.z,
    -0.0041960863*lms.x-0.7034186147*lms.y+1.7076147010*lms.z
  ),0.0,1.0);
  return mix(12.92*r,1.055*pow(r,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),r));
}

float line(float x) {
  float d = abs(fract(x+0.5)-0.5);
  float l = 1.0-smoothstep(0.0,max(fwidth(x),0.000005)//--r--//,d);
  return l * (2.0 - l);
}

const float r0 = 0.08499547839164734*1.28*1.5;
const float o = 0.8936868*PI;
void main() {
  vec2 uv = mix(iD.xy,iD.zw,(gl_FragCoord.xy-0.5)/(iR-1.0));
  vec2 z = f(uv);
  if (dot(z,z)<1e-16) z = vec2(1e-16);
  float ang = atan(z.y,z.x);
  float mag = length(z);
  float light = mag/(mag+1.0);

  float c = r0*(1.0-2.0*abs(light-0.5));
  float ca = cos(ang+o);
  float sa = sin(ang+o);
  vec3 col = oklab2rgb(vec3(light,c*ca,c*sa));

  float lm = //--b--//;
  bool l1 = abs(mag-1.0)<0.25;
  vec3 mc = l1?vec3(0.6):vec3(0.3);
  if (mag<0.75) mc = vec3(0.6);
  col = mix(col,mc,line(lm)*(l1?0.6:0.3));

  float la = 1.5/2.5;
  float ac = r0*(1.0-2.0*abs(la-0.5));
  vec3 lc = oklab2rgb(vec3(la,ac*ca,ac*sa));
  col = mix(col,lc,line(ang/TAU*4.0)*0.5);

  fragColor = vec4(col,1);
}`;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const toSRGB = (x) =>
  clamp(x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
const oklab2rgb = (L, A, B) => {
  let l = L + 0.3963377774 * A + 0.2158037573 * B;
  let m = L - 0.1055613458 * A - 0.0638541728 * B;
  let s = L - 0.0894841775 * A - 1.291485548 * B;
  l = l * l * l;
  m = m * m * m;
  s = s * s * s;
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [toSRGB(r), toSRGB(g), toSRGB(b)];
}

const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2", {
  premultipliedAlpha: false,
  antialias: false
});
if (!gl) throw new Error("WebGL2 not supported");
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const b = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, b);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 3, -1, -1, 3]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

const makeShader = (type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
};
const vss = makeShader(gl.VERTEX_SHADER, vs);


const getProgram = (f, { pixelRatio, base }) => {
  const p = gl.createProgram();
  const s = 1 / Math.log(base);
  const bs = Number.isInteger(s) ? `${s}.0` : `${s}`;
  const b =
    base === 2 || base === 1 || base <= 0
      ? "log2(mag)"
      : Math.abs(base - Math.E) < 1e-12
      ? "log(mag)"
      : `log(mag)*${bs}`;
  const fss = makeShader(
    gl.FRAGMENT_SHADER,
    fs
      .replace("//--f--//", f)
      .replace("//--b--//", b)
      .replace("//--r--//", "*2.0")
  );
  gl.attachShader(p, vss);
  gl.attachShader(p, fss);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const msg = gl.getShaderInfoLog(fss).replace(/\0+$/, "");
    gl.deleteProgram(p);
    throw new Error(msg);
  }
  gl.deleteShader(fss);
  return p;
};

class cmark extends Plot.Mark {
  constructor({ f, x1, x2, y1, y2, pixelRatio, base, rest }) {
    super(undefined, rest);
    this._d = [x1, x2, y1, y2];
    this._r = pixelRatio;
    this.program = getProgram(f, {
      pixelRatio,
      base
    });
    this.liD = gl.getUniformLocation(this.program, "iD");
    this.liR = gl.getUniformLocation(this.program, "iR");
    this.canvas2 = document.createElement("canvas");
    this.ctx = this.canvas2.getContext("2d");
  }
  render(_i, scales, _v, d, ctx) {
    const w = d.width - d.marginLeft - d.marginRight;
    const h = d.height - d.marginTop - d.marginBottom;
    const dx =
      scales.x && scales.x.domain
        ? scales.x.domain()
        : [this._d[0], this._d[1]];
    const dy =
      scales.y && scales.y.domain
        ? scales.y.domain()
        : [this._d[2], this._d[3]];
    const sw = Math.max(1, Math.round(w * this._r));
    const sh = Math.max(1, Math.round(h * this._r));

    if (canvas.width !== sw) canvas.width = sw;
    if (canvas.height !== sh) canvas.height = sh;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(this.program);
    gl.bindVertexArray(vao);
    gl.uniform4f(this.liD, dx[0], dy[0], dx[1], dy[1]);
    gl.uniform2f(this.liR, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    ctx?.invalidation?.then(() => {
      gl.deleteProgram(this.program);
    });

    if (this.canvas2.width !== canvas.width)
      this.canvas2.width = canvas.width;
    if (this.canvas2.height !== canvas.height)
      this.canvas2.height = canvas.height;

    this.ctx.drawImage(canvas, 0, 0);

    const NS = "http://www.w3.org/2000/svg";
    const fo = document.createElementNS(NS, "foreignObject");
    fo.setAttribute("width", w);
    fo.setAttribute("height", h);
    this.canvas2.style.width = `${w}px`;
    this.canvas2.style.height = `${h}px`;
    fo.appendChild(this.canvas2);

    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${d.marginLeft},${d.marginTop})`);
    g.appendChild(fo);

    return g;
  }
}

export function complexMark(f, options = {}) {
  const {
    x1 = -1,
    x2 = 1,
    y1 = -1,
    y2 = 1,
    pixelRatio = Math.max(devicePixelRatio, 2),
    base = 2,
    ...rest
  } = options;
  return new cmark({
    f,
    x1,
    x2,
    y1,
    y2,
    pixelRatio,
    base,
    rest
  });
}
