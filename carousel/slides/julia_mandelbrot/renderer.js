import {theme} from '../theme.js';
// GPU version of the original notebook's escape-time loops and grayscale palette.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
`;
const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform vec2 parameter;
uniform vec4 bounds;
uniform bool mandelbrot;
uniform bool darkMode;
void main() {
  vec2 z = mix(bounds.xz, bounds.yw, uv);
  vec2 c = mandelbrot ? z : parameter;
  float count = 0.0;
  float limit = darkMode ? (mandelbrot ? 100.0 : 500.0) : 180.0;
  for (int i = 1; i < 500; i++) {
    if (dot(z, z) > 4.0 || float(i) >= limit) break;
    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    count = float(i);
  }
  // Preserve the original Mandelbrot contrast, but use a softer, cool
  // escape-time palette for Julia filaments just outside the Mandelbrot set.
  bool escaped = dot(z, z) > 4.0;
  vec3 shade = vec3(0.0);
  if (darkMode && !mandelbrot) {
    float detail = escaped ? pow(count / (limit - 1.0), 0.7) : 1.0;
    shade = mix(vec3(0.043, 0.071, 0.102), vec3(0.78, 0.85, 0.91), detail);
  } else if (escaped) {
    float gray = darkMode
      ? clamp(pow(255.0 * count / (limit + 1.0), 1.5) / 255.0, 0.0, 1.0)
      : 1.0 - count / 179.0;
    shade = vec3(gray);
  }
  gl_FragColor = vec4(shade, 1.0);
}
`;
export function renderer(canvas, bounds, mandelbrot = false) {
  const gl = canvas.getContext('webgl', {alpha: false, antialias: false, preserveDrawingBuffer: true});
  if (!gl) throw new Error('This visualization requires WebGL.');
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
    return result;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(gl.getUniformLocation(program, 'bounds'), bounds);
  gl.uniform1i(gl.getUniformLocation(program, 'mandelbrot'), mandelbrot ? 1 : 0);
  const parameter = gl.getUniformLocation(program, 'parameter');
  const darkMode = gl.getUniformLocation(program, 'darkMode');
  return c => {
    const size = Math.max(240, Math.min(1100, Math.round(canvas.getBoundingClientRect().width * Math.min(devicePixelRatio, 1.5))));
    if (canvas.width !== size || canvas.height !== size) canvas.width = canvas.height = size;
    gl.viewport(0, 0, size, size);
    gl.uniform2fv(parameter, c);
    gl.uniform1i(darkMode, theme.dark ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
