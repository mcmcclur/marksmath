import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// Press V in the plot, then replace this object with the copied JSON.
// A saved viewport preserves the framing at any size by keeping its aspect ratio.
// Leave viewport null to use the page's responsive height instead.
export const INITIAL_VIEW = {
  "version": 1,
  "projection": "perspective",
  "position": [
    7.019369336936971,
    2.1382401382249756,
    12.94249776943728
  ],
  "target": [
    0,
    0,
    0
  ],
  "up": [
    0,
    1,
    0
  ],
  "zoom": 1,
  "fov": 45,
  "near": 0.1,
  "far": 100,
  "orthographicHalfHeight": 1,
  "viewport": {
    "width": 799,
    "height": 640
  }
};

// The kth logarithm branch: exp(x (log|x| + i(arg(x) + 2 pi k))).
// Use the continuous limiting value at zero, as in the Observable notebook.
export function x2x(x, k) {
  if (Math.abs(x) < 0.000001) return { re: 1, im: 0 };
  const radius = Math.exp(x * Math.log(Math.abs(x)));
  const angle = x * ((x < 0 ? Math.PI : 0) + 2 * Math.PI * k);
  return { re: radius * Math.cos(angle), im: radius * Math.sin(angle) };
}

export const thread = (k) => [-k, k].map(branch =>
  Array.from({ length: 6001 }, (_, i) => {
    const x = -4 + i * 0.001;
    const xx = x2x(x, branch);
    return [2 * x, xx.re, xx.im];
  })
);

export function make_spindle({ maxThreads = 15, view = INITIAL_VIEW } = {}) {
  const container = document.createElement("div");
  container.style.cssText = "width:100%;height:clamp(300px,65vw,640px);position:relative";
  if (view.viewport) {
    container.style.height = "auto";
    container.style.aspectRatio = `${view.viewport.width} / ${view.viewport.height}`;
  }
  const scene = new THREE.Scene();
  const perspective = new THREE.PerspectiveCamera(view.fov, 1, view.near, view.far);
  const orthographic = new THREE.OrthographicCamera(-1, 1, 1, -1, view.near, view.far);
  let camera = view.projection === "orthographic" ? orthographic : perspective;
  const halfFovTangent = Math.tan(THREE.MathUtils.degToRad(view.fov / 2));
  let orthoHalfHeight = view.orthographicHalfHeight;
  camera.position.fromArray(view.position);
  camera.up.fromArray(view.up);
  camera.zoom = view.zoom;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-keyshortcuts", "r 1 2 3 o v");
  renderer.domElement.setAttribute("aria-label", "Three-dimensional x to the x spindle. Drag to rotate; scroll or pinch to zoom. R resets the view; 1 front, 2 side, 3 top; O toggles orthographic projection; V copies the view as JSON.");
  container.append(renderer.domElement);
  const projectionButton = document.createElement("button");
  projectionButton.type = "button";
  projectionButton.className = "btn btn-outline-secondary btn-sm";
  projectionButton.style.cssText = "position:absolute;top:8px;right:8px;z-index:1";
  projectionButton.textContent = camera.isOrthographicCamera ? "Orthographic" : "Perspective";
  projectionButton.title = "Toggle orthographic projection (O)";
  projectionButton.setAttribute("aria-label", "Orthographic projection");
  projectionButton.setAttribute("aria-pressed", String(Boolean(camera.isOrthographicCamera)));
  projectionButton.addEventListener("click", toggleProjection);
  container.append(projectionButton);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.fromArray(view.target);
  controls.minDistance = 3;
  controls.maxDistance = 45;
  if (camera.isOrthographicCamera) {
    controls.minZoom = orthoHalfHeight / (45 * halfFovTangent);
    controls.maxZoom = orthoHalfHeight / (3 * halfFovTangent);
  }
  controls.update();
  controls.saveState();
  const initialPosition = camera.position.clone();
  const initialTarget = controls.target.clone();
  const initialHalfHeight = camera.isOrthographicCamera
    ? orthoHalfHeight / camera.zoom
    : initialPosition.distanceTo(initialTarget) * halfFovTangent / camera.zoom;
  let transitionFrame = null;

  function cancelTransition() {
    if (transitionFrame !== null) cancelAnimationFrame(transitionFrame);
    transitionFrame = null;
  }

  function transitionTo(position, target, endZoom = camera.zoom) {
    cancelTransition();
    const startTarget = controls.target.clone();
    const start = new THREE.Spherical().setFromVector3(camera.position.clone().sub(startTarget));
    const end = new THREE.Spherical().setFromVector3(position.clone().sub(target));
    // Follow the shorter arc around the spindle, keeping the camera upright.
    const deltaTheta = Math.atan2(Math.sin(end.theta - start.theta), Math.cos(end.theta - start.theta));
    const startZoom = camera.zoom;
    const started = performance.now();
    function animate(now) {
      const t = Math.min(1, (now - started) / 700);
      const eased = t * t * (3 - 2 * t);
      controls.target.lerpVectors(startTarget, target, eased);
      const offset = new THREE.Vector3().setFromSpherical(new THREE.Spherical(
        THREE.MathUtils.lerp(start.radius, end.radius, eased),
        THREE.MathUtils.lerp(start.phi, end.phi, eased),
        start.theta + deltaTheta * eased
      ));
      camera.position.copy(controls.target).add(offset);
      camera.zoom = THREE.MathUtils.lerp(startZoom, endZoom, eased);
      camera.updateProjectionMatrix();
      controls.update();
      transitionFrame = t < 1 ? requestAnimationFrame(animate) : null;
    }
    transitionFrame = requestAnimationFrame(animate);
  }
  // A drag or wheel gesture immediately takes control from the animation.
  controls.addEventListener("start", cancelTransition);

  function toggleProjection() {
    cancelTransition();
    const previous = camera;
    const distance = previous.position.distanceTo(controls.target);
    if (previous.isPerspectiveCamera) {
      orthoHalfHeight = distance * halfFovTangent / previous.zoom;
      camera = orthographic;
      camera.zoom = 1;
      controls.minZoom = orthoHalfHeight / (45 * halfFovTangent);
      controls.maxZoom = orthoHalfHeight / (3 * halfFovTangent);
    } else {
      camera = perspective;
      camera.zoom = 1;
    }
    camera.position.copy(previous.position);
    camera.quaternion.copy(previous.quaternion);
    camera.up.copy(previous.up);
    if (camera.isPerspectiveCamera) {
      // Match the orthographic scale in the plane through the orbit center.
      const equivalentDistance = orthoHalfHeight / previous.zoom / halfFovTangent;
      camera.position.sub(controls.target).normalize().multiplyScalar(equivalentDistance).add(controls.target);
    }
    controls.object = camera;
    resize();
    controls.update();
    const isOrtho = camera.isOrthographicCamera;
    projectionButton.textContent = isOrtho ? "Orthographic" : "Perspective";
    projectionButton.setAttribute("aria-pressed", String(Boolean(isOrtho)));
    focusPlot();
  }

  function focusPlot() {
    renderer.domElement.focus({ preventScroll: true });
  }
  function onKeyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === "v") {
      event.preventDefault();
      copyView();
      return;
    }
    if (key === "o") {
      event.preventDefault();
      toggleProjection();
      return;
    }
    if (key === "r") {
      event.preventDefault();
      transitionTo(initialPosition.clone(), initialTarget.clone(),
        camera.isOrthographicCamera ? orthoHalfHeight / initialHalfHeight
          : initialPosition.distanceTo(initialTarget) * halfFovTangent / initialHalfHeight);
      return;
    }
    // Presets preserve the current pan center and viewing distance.
    // Front looks down +Im toward the x/Re plane; side looks down +x.
    // A tiny top-view tilt avoids OrbitControls' pole singularity.
    const direction = {
      "1": [0, 0, 1],
      "2": [1, 0, 0],
      "3": [0, 1, 0.000001]
    }[key];
    if (!direction) return;
    event.preventDefault();
    const distance = camera.position.distanceTo(controls.target);
    transitionTo(
      controls.target.clone().add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance)),
      controls.target.clone()
    );
  }
  const copyStatus = document.createElement("div");
  copyStatus.setAttribute("role", "status");
  copyStatus.setAttribute("aria-live", "polite");
  copyStatus.style.cssText = "position:absolute;bottom:8px;left:8px;padding:3px 8px;border-radius:4px;background:var(--bs-body-bg,white);font-size:0.875rem;pointer-events:none";
  copyStatus.hidden = true;
  container.append(copyStatus);
  let statusTimeout = null;
  let manualCopy = null;

  function getView() {
    return {
      version: 1,
      projection: camera.isOrthographicCamera ? "orthographic" : "perspective",
      position: camera.position.toArray(),
      target: controls.target.toArray(),
      up: camera.up.toArray(),
      zoom: camera.zoom,
      fov: perspective.fov,
      near: camera.near,
      far: camera.far,
      orthographicHalfHeight: orthoHalfHeight,
      viewport: { width: renderer.domElement.clientWidth, height: renderer.domElement.clientHeight }
    };
  }

  async function copyView() {
    // Freeze an in-progress preset transition at the view being recorded.
    cancelTransition();
    const json = JSON.stringify(getView(), null, 2);
    clearTimeout(statusTimeout);
    manualCopy?.remove();
    manualCopy = null;
    let copied = false;
    try {
      await navigator.clipboard.writeText(json);
      copied = true;
    } catch {
      // Also support browsers where the asynchronous clipboard API is unavailable.
      const field = document.createElement("textarea");
      field.value = json;
      field.readOnly = true;
      field.setAttribute("aria-label", "Viewpoint JSON to copy");
      field.style.cssText = "position:absolute;bottom:42px;left:8px;width:calc(100% - 16px);height:130px;font:12px monospace";
      container.append(field);
      field.select();
      try { copied = document.execCommand("copy"); } catch { /* Leave JSON selected for manual copying. */ }
      if (copied) {
        field.remove();
        focusPlot();
      } else {
        manualCopy = field;
      }
    }
    if (disposed) return;
    copyStatus.textContent = copied ? "View JSON copied" : "Copy the selected view JSON with Ctrl/Cmd+C.";
    copyStatus.hidden = false;
    if (copied) statusTimeout = setTimeout(() => { copyStatus.hidden = true; }, 3000);
  }

  renderer.domElement.addEventListener("pointerdown", focusPlot);
  renderer.domElement.addEventListener("keydown", onKeyDown);

  const principalPoints = Array.from({ length: 1201 }, (_, i) => {
    const x = -4 + i * 0.005;
    const xx = x2x(x, 0);
    return new THREE.Vector3(2 * x, xx.re, xx.im);
  });
  const principal = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(principalPoints), 1200, 0.025, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x151515 })
  );
  scene.add(principal);

  // Each thread contains both +k and -k, with the notebook's opacity falloff.
  const threads = Array.from({ length: maxThreads }, (_, i) => {
    const k = i + 1;
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({
      color: 0x2468a0, transparent: true, opacity: 1 / 1.08 ** (3 * k), depthWrite: false
    });
    for (const points of thread(k)) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
      group.add(new THREE.Line(geometry, material));
    }
    scene.add(group);
    return group;
  });

  const axes = [];
  for (const [origin, direction, length] of [
    [[-8, 0, 0], [1, 0, 0], 13],
    [[0, -4, 0], [0, 1, 0], 8],
    [[0, 0, -4], [0, 0, 1], 8]
  ]) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(...direction), new THREE.Vector3(...origin), length, 0x666666, 0.2, 0.12
    );
    axes.push(arrow);
    scene.add(arrow);
  }

  const labels = [];
  function label(text, position) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    context.font = "32px Georgia";
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.fillText(text, 128, 43);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.position.set(...position);
    sprite.scale.set(2, 0.5, 1);
    labels.push(sprite);
    scene.add(sprite);
  }
  label("x", [5.3, 0, 0]);
  label("Re(xˣ)", [0, 4.4, 0]);
  label("Im(xˣ)", [0, 0, 4.4]);

  let disposed = false;
  function render() {
    if (!disposed) renderer.render(scene, camera);
  }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    if (camera.isOrthographicCamera) {
      camera.left = -orthoHalfHeight * aspect;
      camera.right = orthoHalfHeight * aspect;
      camera.top = orthoHalfHeight;
      camera.bottom = -orthoHalfHeight;
    } else {
      camera.aspect = aspect;
    }
    camera.updateProjectionMatrix();
    render();
  }
  function updateTheme() {
    const dark = document.body.classList.contains("quarto-dark");
    principal.material.color.set(dark ? 0xf1f3f5 : 0x151515);
    threads.forEach(group => group.children.forEach(line => {
      line.material.color.set(dark ? 0x80c4ff : 0x2468a0);
    }));
    axes.forEach(arrow => arrow.setColor(dark ? 0xaeb8c2 : 0x666666));
    labels.forEach(sprite => sprite.material.color.set(dark ? 0xdce3ea : 0x444444));
    render();
  }
  // Quarto switches the body class when its light/dark toggle is used.
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  updateTheme();

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  controls.addEventListener("change", render);

  container.getView = getView;
  container.update = (count) => {
    const n = Math.max(0, Math.min(maxThreads, Math.round(Number(count) || 0)));
    threads.forEach((group, i) => { group.visible = i < n; });
    render();
  };
  container.destroy = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(statusTimeout);
    cancelTransition();
    controls.removeEventListener("start", cancelTransition);
    observer.disconnect();
    themeObserver.disconnect();
    controls.removeEventListener("change", render);
    renderer.domElement.removeEventListener("pointerdown", focusPlot);
    renderer.domElement.removeEventListener("keydown", onKeyDown);
    projectionButton.removeEventListener("click", toggleProjection);
    controls.dispose();
    const geometries = new Set();
    const materials = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      material.map?.dispose();
      material.dispose();
    });
    renderer.dispose();
  };
  return container;
}
