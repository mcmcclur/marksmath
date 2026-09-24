import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// Local copy of Fabian Iwand's @mootari/2d-slider API.
// Source: https://observablehq.com/@mootari/2d-slider
export function xySlider(options = {}) {
  const {
    min = 0,
    max = 1,
    step = "any",
    value: defaultValue = [null, null],
    xmin = min,
    xmax = max,
    xstep = step,
    xvalue = defaultValue[0] ?? (xmin + xmax) / 2,
    ymin = min,
    ymax = max,
    ystep = step,
    yvalue = defaultValue[1] ?? (ymin + ymax) / 2,
    width = "150px",
    height = width,
    xkeystep = xstep === "any" ? (xmax - xmin) / 10 : xstep,
    ykeystep = ystep === "any" ? (ymax - ymin) / 10 : ystep
  } = options;

  const scope = `xy-slider-${Math.random().toString(36).slice(2)}`;
  const root = document.createElement("div");
  root.className = `${scope} xy-picker`;
  root.innerHTML = `
    <div class="zone" tabindex="0">
      <div class="thumb"></div>
    </div>
    <style>
      .${scope} {
        width: ${cssLength(width)};
        height: ${cssLength(height)};
        color: #3b99fc;
        --thumb-size: 15px;
        padding: .5em;
      }
      .${scope} .zone {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background:
          linear-gradient(to top left, #ffffff80 25%, transparent 0, transparent 75%, #ffffff80 0) 0 0 / 20px 20px,
          linear-gradient(to top left, #ffffff80 25%, transparent 0, transparent 75%, #ffffff80 0) 10px 10px / 20px 20px;
        background-color: hsl(0, 0%, 80%);
        box-shadow: inset 0 1px 3px -1px rgba(0, 0, 0, 0.33);
        border-radius: 3px;
        border: 1px inset hsl(0, 0%, 70%);
      }
      .${scope} .zone::before,
      .${scope} .zone::after {
        box-sizing: border-box;
        content: "";
        position: absolute;
        background: currentColor;
      }
      .${scope} .zone::before {
        width: 5px;
        height: 100%;
        top: 0;
        left: var(--x);
        transform: translateX(-2.5px);
      }
      .${scope} .zone::after {
        width: 100%;
        height: 5px;
        top: var(--y);
        left: 0;
        transform: translateY(-2.5px);
      }
      .${scope} .thumb {
        box-sizing: border-box;
        position: absolute;
        left: var(--x);
        top: var(--y);
        transform: translate(calc(var(--thumb-size) / -2), calc(var(--thumb-size) / -2));
        width: var(--thumb-size);
        height: var(--thumb-size);
        border-radius: var(--thumb-size);
        z-index: 1;
        background: #eee linear-gradient(0deg, #fff0 50%, #fff9 50%, #fff5);
        border: 1px solid hsl(0, 0%, 55%);
      }
    </style>
  `;

  const zone = root.querySelector(".zone");
  let current = [
    roundToStep(xvalue, xmin, xmax, xstep),
    roundToStep(yvalue, ymin, ymax, ystep)
  ];
  let originValue = current.slice();
  let originOffset = [0, 0];

  function setValue(x, y, dispatch = false) {
    const previous = current;
    current = [
      roundToStep(x, xmin, xmax, xstep),
      roundToStep(y, ymin, ymax, ystep)
    ];
    root.style.setProperty("--x", `${((current[0] - xmin) / (xmax - xmin)) * 100}%`);
    root.style.setProperty("--y", `${((current[1] - ymin) / (ymax - ymin)) * 100}%`);

    if (dispatch && (previous[0] !== current[0] || previous[1] !== current[1])) {
      root.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function offsetFromEvent(event) {
    const rect = zone.getBoundingClientRect();
    return [
      clamp((event.clientX - rect.left) / rect.width, 0, 1),
      clamp((event.clientY - rect.top) / rect.height, 0, 1)
    ];
  }

  function moveTo(tx, ty) {
    setValue(
      xmin + (xmax - xmin) * tx,
      ymin + (ymax - ymin) * ty,
      true
    );
  }

  function moveBy(tx, ty) {
    setValue(
      originValue[0] + (xmax - xmin) * (tx - originOffset[0]),
      originValue[1] + (ymax - ymin) * (ty - originOffset[1]),
      true
    );
  }

  zone.addEventListener("pointerdown", event => {
    event.preventDefault();
    zone.focus();
    zone.setPointerCapture(event.pointerId);
    originValue = current.slice();
    originOffset = offsetFromEvent(event);
    if (!event.shiftKey) moveTo(...originOffset);
  });

  zone.addEventListener("pointermove", event => {
    if (!zone.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    const offset = offsetFromEvent(event);
    event.shiftKey ? moveBy(...offset) : moveTo(...offset);
  });

  zone.addEventListener("pointerup", event => {
    if (zone.hasPointerCapture(event.pointerId)) {
      zone.releasePointerCapture(event.pointerId);
    }
  });

  zone.addEventListener("keydown", event => {
    if (event.shiftKey || event.metaKey || event.altKey) return;
    const move = (dx, dy) => {
      event.preventDefault();
      setValue(current[0] + dx * xkeystep, current[1] + dy * ykeystep, true);
    };
    if (event.key === "ArrowLeft") move(-1, 0);
    if (event.key === "ArrowRight") move(1, 0);
    if (event.key === "ArrowUp") move(0, -1);
    if (event.key === "ArrowDown") move(0, 1);
  });

  setValue(current[0], current[1]);

  return Object.defineProperty(root, "value", {
    enumerable: true,
    get: () => current,
    set: ([x, y]) => setValue(x, y)
  });
}

const DOMAIN_SPAN = 1.45;
const MESH_STEPS = 84;
const GRID_LINES = 13;
const GRID_SAMPLES = 170;
const OUTPUT_PLANE_SPAN = 80;
const SPHERE_PATCH_RADIUS = 1.006;
const BASE_SPHERE_OPACITY = 0.19;
const BASE_PATCH_OPACITY = 0.84;
const BASE_SPHERE_GRID_OPACITY = 0.56;
const CAMERA_TRANSITION_MS = 900;
const PLANE_CAMERA_FOV = 14;
const PLANE_CAMERA_DISTANCE = 82;
// One third of the visible half-height puts the origin two thirds down the view.
const PLANE_CAMERA_CENTER_Y = PLANE_CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(PLANE_CAMERA_FOV) / 2) / 3;
const SPACE_CAMERA_POSE = {
  position: new THREE.Vector3(5.4, -8.4, 5.7),
  target: new THREE.Vector3(0, 0, 1.6),
  up: new THREE.Vector3(0, 0, 1),
  fov: 38
};
const PLANE_CAMERA_POSE = {
  position: new THREE.Vector3(0, PLANE_CAMERA_CENTER_Y, PLANE_CAMERA_DISTANCE),
  target: new THREE.Vector3(0, PLANE_CAMERA_CENTER_Y, 0),
  up: new THREE.Vector3(0, 1, 0),
  fov: PLANE_CAMERA_FOV
};

export function mobiusRevealedThree(options = {}) {
  const {
    background = "transparent"
  } = options;

  const container = document.createElement("div");
  container.className = "mobius-revealed-three";

  const canvasHost = document.createElement("div");
  canvasHost.className = "mobius-revealed-three__canvas";
  container.appendChild(canvasHost);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(PLANE_CAMERA_POSE.fov, 1, 0.05, 1000);
  camera.position.copy(PLANE_CAMERA_POSE.position);
  camera.up.copy(PLANE_CAMERA_POSE.up);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: background === "transparent"
  });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio ?? 1, 2));
  renderer.setClearColor(0x000000, background === "transparent" ? 0 : 1);
  canvasHost.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(PLANE_CAMERA_POSE.target);
  controls.enabled = false;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x405060, 1.8));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, -6, 8);
  scene.add(keyLight);

  const plane = makePlane();
  scene.add(plane);

  const axes = makeAxes();
  scene.add(axes);

  const sphereShell = makeSphereShell();
  scene.add(sphereShell);

  const sphereMesh = makeDomainMesh({ onSphere: true });
  scene.add(sphereMesh);

  const planeMesh = makeOutputPlaneMesh();
  planeMesh.renderOrder = 2;
  scene.add(planeMesh);

  const sphereGrid = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0x101820,
      transparent: true,
      opacity: 0.56
    })
  );
  sphereGrid.renderOrder = 3;
  scene.add(sphereGrid);

  let state = {
    phi: 0,
    theta: 0,
    psi: 0,
    z: 0,
    xy: [0, 0],
    showSphere: false,
    viewMode: "plane"
  };

  let animationId = null;
  let disposed = false;
  let activeViewMode = "plane";
  let viewTransition = null;

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasHost);

  function update(next = {}) {
    state = {
      phi: finiteNumber(next.phi, state.phi),
      theta: finiteNumber(next.theta, state.theta),
      psi: finiteNumber(next.psi, state.psi),
      z: finiteNumber(next.z, state.z),
      xy: normalizeXY(next.xy, state.xy),
      showSphere: next.showSphere ?? state.showSphere,
      viewMode: normalizeViewMode(next.viewMode, state.viewMode)
    };

    const frame = makeFrame(state);
    sphereShell.position.copy(frame.center);
    updateSphereDomain(sphereMesh.geometry, frame);
    updateOutputPlane(planeMesh.material, frame);
    updateGrid(sphereGrid.geometry, frame);
    updateSphereVisibility(state.showSphere);
    updateViewMode(state.viewMode);
    render();
  }

  function resize() {
    const width = Math.max(320, Math.round(canvasHost.clientWidth || 760));
    const nextHeight = Math.max(420, Math.round(canvasHost.clientHeight || 640));
    renderer.setSize(width, nextHeight, false);
    camera.aspect = width / nextHeight;
    camera.updateProjectionMatrix();
    render();
  }

  function animate() {
    if (disposed) return;
    updateCameraTransition();
    if (controls.enabled) {
      controls.update();
    }
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function destroy() {
    disposed = true;
    if (animationId !== null) cancelAnimationFrame(animationId);
    resizeObserver.disconnect();
    controls.dispose();
    renderer.dispose();
    disposeObject(scene);
  }

  function updateSphereVisibility(showSphere) {
    sphereShell.visible = showSphere;
    sphereMesh.visible = showSphere;
    sphereGrid.visible = showSphere;
  }

  function updateViewMode(viewMode) {
    if (viewMode === (viewTransition?.viewMode ?? activeViewMode)) return;

    const from = readCameraPose();
    const to = poseForViewMode(viewMode);
    viewTransition = {
      from,
      to,
      start: performance.now(),
      viewMode
    };
    controls.enabled = false;
  }

  function updateCameraTransition() {
    if (!viewTransition) return;

    const elapsed = performance.now() - viewTransition.start;
    const t = smoothstep(clamp(elapsed / CAMERA_TRANSITION_MS, 0, 1));
    applyCameraPose(lerpPose(viewTransition.from, viewTransition.to, t));

    if (t >= 1) {
      activeViewMode = viewTransition.viewMode;
      viewTransition = null;
      controls.enabled = activeViewMode === "space";
      controls.target.copy(poseForViewMode(activeViewMode).target);
      if (controls.enabled) controls.update();
    }
  }

  function readCameraPose() {
    return {
      position: camera.position.clone(),
      target: controls.target.clone(),
      up: camera.up.clone(),
      fov: camera.fov
    };
  }

  function applyCameraPose(pose) {
    camera.position.copy(pose.position);
    camera.up.copy(pose.up).normalize();
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    controls.target.copy(pose.target);
    camera.lookAt(pose.target);
  }

  container.update = update;
  container.destroy = destroy;

  resize();
  update(state);
  animate();

  return container;
}

function makePlane() {
  const geometry = new THREE.PlaneGeometry(2 * OUTPUT_PLANE_SPAN, 2 * OUTPUT_PLANE_SPAN);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd4e9ee,
    metalness: 0,
    roughness: 0.85,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  return new THREE.Mesh(geometry, material);
}

function makeAxes() {
  const group = new THREE.Group();
  group.add(axisLine(new THREE.Vector3(-18, 0, 0.006), new THREE.Vector3(18, 0, 0.006), 0xbf8f1d));
  group.add(axisLine(new THREE.Vector3(0, -18, 0.007), new THREE.Vector3(0, 18, 0.007), 0xbf8f1d));
  group.add(axisLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 5.2), 0xbf8f1d));
  return group;
}

function axisLine(a, b, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
  return new THREE.Line(geometry, material);
}

function makeSphereShell() {
  const geometry = new THREE.SphereGeometry(1, 72, 36);
  const material = new THREE.MeshStandardMaterial({
    color: 0x0073a8,
    metalness: 0,
    roughness: 0.55,
    transparent: true,
    opacity: BASE_SPHERE_OPACITY,
    side: THREE.DoubleSide
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(0, 0, 1);
  return sphere;
}

function makeDomainMesh() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const indices = [];

  for (let j = 0; j <= MESH_STEPS; j++) {
    const v = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, j / MESH_STEPS);
    for (let i = 0; i <= MESH_STEPS; i++) {
      const u = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, i / MESH_STEPS);
      positions.push(0, 0, 0);
      colors.push(...domainColor(u, v));
    }
  }

  for (let j = 0; j < MESH_STEPS; j++) {
    for (let i = 0; i < MESH_STEPS; i++) {
      const a = gridIndex(i, j);
      const b = gridIndex(i + 1, j);
      const c = gridIndex(i, j + 1);
      const d = gridIndex(i + 1, j + 1);
      indices.push(a, b, d, a, d, c);
    }
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    vertexColors: true,
    transparent: true,
    opacity: BASE_PATCH_OPACITY,
    roughness: 0.62,
    metalness: 0
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 1;
  return mesh;
}

function makeOutputPlaneMesh() {
  const geometry = new THREE.PlaneGeometry(2 * OUTPUT_PLANE_SPAN, 2 * OUTPUT_PLANE_SPAN);
  geometry.translate(0, 0, 0.014);

  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    extensions: {
      derivatives: true
    },
    uniforms: {
      phi: { value: 0 },
      theta: { value: 0 },
      phiAxis: { value: new THREE.Vector3(1, 0, 0) },
      center: { value: new THREE.Vector3(0, 0, 1) },
      domainSpan: { value: DOMAIN_SPAN },
      gridSpacing: { value: (2 * DOMAIN_SPAN) / (GRID_LINES - 1) },
      opacity: { value: 0.78 }
    },
    vertexShader: `
      varying vec3 worldPosition;

      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        worldPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      #ifdef GL_OES_standard_derivatives
      #extension GL_OES_standard_derivatives : enable
      #endif

      precision highp float;

      uniform float phi;
      uniform float theta;
      uniform vec3 phiAxis;
      uniform vec3 center;
      uniform float domainSpan;
      uniform float gridSpacing;
      uniform float opacity;

      varying vec3 worldPosition;

      vec3 rotateZ(vec3 p, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
      }

      vec3 rotateAxis(vec3 p, vec3 axis, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
      }

      vec3 turbo(float x) {
        x = clamp(x, 0.0, 1.0);
        vec4 kRed = vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
        vec4 kGreen = vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
        vec4 kBlue = vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
        vec2 kRed2 = vec2(-152.94239396, 59.28637943);
        vec2 kGreen2 = vec2(4.27729857, 2.82956604);
        vec2 kBlue2 = vec2(-89.90310912, 27.34824973);
        vec4 v4 = vec4(1.0, x, x * x, x * x * x);
        vec2 v2 = v4.zw * v4.z;
        return clamp(vec3(
          dot(v4, kRed) + dot(v2, kRed2),
          dot(v4, kGreen) + dot(v2, kGreen2),
          dot(v4, kBlue) + dot(v2, kBlue2)
        ), 0.0, 1.0);
      }

      float gridLine(vec2 uv) {
        vec2 grid = (uv + domainSpan) / gridSpacing;
        vec2 distanceToLine = abs(fract(grid + 0.5) - 0.5);
        float nearest = min(distanceToLine.x, distanceToLine.y);
        float width = max(0.004, 0.75 * max(fwidth(grid.x), fwidth(grid.y)));
        return 1.0 - smoothstep(0.0, width, nearest);
      }

      void main() {
        float height = center.z + 1.0;
        if (abs(height) < 0.0001) discard;

        vec2 normalizedPlane = (worldPosition.xy - center.xy) / height;
        float r2 = dot(normalizedPlane, normalizedPlane);
        vec3 movedSphere = vec3(
          2.0 * normalizedPlane / (r2 + 1.0),
          (r2 - 1.0) / (r2 + 1.0)
        );

        vec3 localSphere = rotateAxis(movedSphere, phiAxis, -phi);
        localSphere = rotateZ(localSphere, -theta);

        float denominator = 1.0 - localSphere.z;
        if (abs(denominator) < 0.0001) discard;

        vec2 uv = localSphere.xy / denominator;
        if (abs(uv.x) > domainSpan || abs(uv.y) > domainSpan) discard;

        vec3 color = turbo((uv.x + domainSpan) / (2.0 * domainSpan));
        float line = gridLine(uv);
        color = mix(color, vec3(0.05, 0.07, 0.08), line * 0.34);

        gl_FragColor = vec4(color, opacity);
      }
    `
  });

  return new THREE.Mesh(geometry, material);
}

function updateOutputPlane(material, frame) {
  material.uniforms.phi.value = frame.phi;
  material.uniforms.theta.value = frame.theta;
  material.uniforms.phiAxis.value.copy(frame.phiAxis);
  material.uniforms.center.value.copy(frame.center);
}

function updateSphereDomain(geometry, frame) {
  const position = geometry.getAttribute("position");

  for (let j = 0; j <= MESH_STEPS; j++) {
    const v = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, j / MESH_STEPS);
    for (let i = 0; i <= MESH_STEPS; i++) {
      const u = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, i / MESH_STEPS);
      const point = transformedSpherePoint(u, v, frame);
      const idx = gridIndex(i, j);
      position.setXYZ(idx, point.x, point.y, point.z);
    }
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function updateGrid(sphereGeometry, frame) {
  const spherePositions = [];

  const values = [];
  for (let k = 0; k < GRID_LINES; k++) {
    values.push(lerp(-DOMAIN_SPAN, DOMAIN_SPAN, k / (GRID_LINES - 1)));
  }

  for (const fixed of values) {
    addGridRun(spherePositions, frame, t => [fixed, t]);
    addGridRun(spherePositions, frame, t => [t, fixed]);
  }

  sphereGeometry.setAttribute("position", new THREE.Float32BufferAttribute(spherePositions, 3));
  sphereGeometry.computeBoundingSphere();
}

function addGridRun(spherePositions, frame, parameterAt) {
  for (let k = 0; k < GRID_SAMPLES; k++) {
    const t0 = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, k / GRID_SAMPLES);
    const t1 = lerp(-DOMAIN_SPAN, DOMAIN_SPAN, (k + 1) / GRID_SAMPLES);
    const [u0, v0] = parameterAt(t0);
    const [u1, v1] = parameterAt(t1);
    const s0 = transformedSpherePoint(u0, v0, frame);
    const s1 = transformedSpherePoint(u1, v1, frame);

    spherePositions.push(s0.x, s0.y, s0.z, s1.x, s1.y, s1.z);
  }
}

function makeFrame({ phi, theta, psi, z, xy }) {
  const center = new THREE.Vector3(xy[0], xy[1], z + 1);
  const phiAxis = new THREE.Vector3(Math.cos(psi), Math.sin(psi), 0);
  return { phi, theta, center, phiAxis };
}

function poseForViewMode(viewMode) {
  return viewMode === "plane" ? PLANE_CAMERA_POSE : SPACE_CAMERA_POSE;
}

function transformedSpherePoint(u, v, frame) {
  const local = inverseStereographic(u, v);
  local.multiplyScalar(SPHERE_PATCH_RADIUS);
  local.applyAxisAngle(new THREE.Vector3(0, 0, 1), frame.theta);
  local.applyAxisAngle(frame.phiAxis, frame.phi);
  return local.add(frame.center);
}

function inverseStereographic(u, v) {
  const r2 = u * u + v * v;
  const den = r2 + 1;
  return new THREE.Vector3(
    (2 * u) / den,
    (2 * v) / den,
    (r2 - 1) / den
  );
}

function domainColor(u, v) {
  const t = (u + DOMAIN_SPAN) / (2 * DOMAIN_SPAN);
  return turbo(t);
}

function turbo(value) {
  const x = clamp(value, 0, 1);
  const x2 = x * x;
  const x3 = x2 * x;
  const x4 = x2 * x2;
  const x5 = x4 * x;

  return [
    clamp(0.13572138 + 4.61539260 * x - 42.66032258 * x2 + 132.13108234 * x3 - 152.94239396 * x4 + 59.28637943 * x5, 0, 1),
    clamp(0.09140261 + 2.19418839 * x + 4.84296658 * x2 - 14.18503333 * x3 + 4.27729857 * x4 + 2.82956604 * x5, 0, 1),
    clamp(0.10667330 + 12.64194608 * x - 60.58204836 * x2 + 110.36276771 * x3 - 89.90310912 * x4 + 27.34824973 * x5, 0, 1)
  ];
}

function gridIndex(i, j) {
  return j * (MESH_STEPS + 1) + i;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeXY(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const x = finiteNumber(value[0], fallback[0]);
  const y = finiteNumber(value[1], fallback[1]);
  return [x, y];
}

function normalizeViewMode(value, fallback) {
  if (value === "Plane" || value === "plane") return "plane";
  if (value === "3D" || value === "space") return "space";
  return fallback;
}

function lerpPose(from, to, t) {
  return {
    position: from.position.clone().lerp(to.position, t),
    target: from.target.clone().lerp(to.target, t),
    up: from.up.clone().lerp(to.up, t).normalize(),
    fov: lerp(from.fov, to.fov, t)
  };
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cssLength(value) {
  return typeof value === "number" ? `${value}px` : value;
}

function roundToStep(value, min, max, step) {
  let next = clamp(Number(value), Math.min(min, max), Math.max(min, max));
  if (step !== "any") {
    const numericStep = Number(step);
    if (Number.isFinite(numericStep) && numericStep > 0) {
      next = min + Math.round((next - min) / numericStep) * numericStep;
    }
  }
  return clamp(next, Math.min(min, max), Math.max(min, max));
}

function disposeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(material => material.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}
