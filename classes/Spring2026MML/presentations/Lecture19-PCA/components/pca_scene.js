// Import jsdelivr didn't work; let's import THREE liks so:
import * as THREE from 'https://esm.sh/three@0.161.0';
import { OrbitControls } from 'https://esm.sh/three@0.161.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById("pca-threejs");

// -------------------------
// Basic utilities
// -------------------------
function dot(a, b) {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

function norm(v) {
  return Math.sqrt(dot(v, v));
}

function scale(v, c) {
  return v.map(x => c * x);
}

function add(a, b) {
  return a.map((x, i) => x + b[i]);
}

function sub(a, b) {
  return a.map((x, i) => x - b[i]);
}

function outer(v) {
  return [
    [v[0] * v[0], v[0] * v[1], v[0] * v[2]],
    [v[1] * v[0], v[1] * v[1], v[1] * v[2]],
    [v[2] * v[0], v[2] * v[1], v[2] * v[2]]
  ];
}

function matVec(A, v) {
  return A.map(row => dot(row, v));
}

function matSub(A, B) {
  return A.map((row, i) => row.map((x, j) => x - B[i][j]));
}

function mean(points) {
  const n = points.length;
  const m = [0, 0, 0];
  for (const p of points) {
    m[0] += p[0];
    m[1] += p[1];
    m[2] += p[2];
  }
  return m.map(x => x / n);
}

function covariance(points, mu) {
  const n = points.length;
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  for (const p of points) {
    const q = sub(p, mu);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        C[i][j] += q[i] * q[j];
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      C[i][j] /= n;
    }
  }

  return C;
}

// -------------------------
// Power iteration for largest eigenpair
// -------------------------
function powerIteration(A, iterations = 100) {
  let v = [1, 1, 1];
  let vnorm = norm(v);
  v = scale(v, 1 / vnorm);

  for (let k = 0; k < iterations; k++) {
    let w = matVec(A, v);
    const wnorm = norm(w);
    if (wnorm < 1e-12) break;
    v = scale(w, 1 / wnorm);
  }

  const Av = matVec(A, v);
  const lambda = dot(v, Av);
  return { value: lambda, vector: v };
}

function deflate(A, lambda, v) {
  const vvT = outer(v);
  const term = vvT.map(row => row.map(x => lambda * x));
  return matSub(A, term);
}

export function pca3(points) {
  const mu = mean(points);
  const C = covariance(points, mu);

  const e1 = powerIteration(C, 200);
  const C2 = deflate(C, e1.value, e1.vector);

  const e2 = powerIteration(C2, 200);
  const C3 = deflate(C2, e2.value, e2.vector);

  const e3 = powerIteration(C3, 200);

  return {
    mean: mu,
    components: [e1.vector, e2.vector, e3.vector],
    eigenvalues: [e1.value, e2.value, e3.value]
  };
}

// -------------------------
// CSV parsing is handled via Observable's FileAttachment.
// -------------------------


// -------------------------
// Three.js scene
// -------------------------
export function buildScene(points, mu, components) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  const width = container.clientWidth;
  const height = container.clientHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(8, 8, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.replaceChildren(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(mu[0], mu[1], mu[2]);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 10, 7);
  scene.add(dir);

  // Grid / axes
  const grid = new THREE.GridHelper(10, 10, 0x999999, 0xdddddd);
  scene.add(grid);

  const axes = new THREE.AxesHelper(3);
  scene.add(axes);

  // Points
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(points.flat());
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x3366cc,
    size: 0.2
  });

  const cloud = new THREE.Points(geometry, material);
  scene.add(cloud);

  // Compute data spread for line lengths
  const mins = [Infinity, Infinity, Infinity];
  const maxs = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let i = 0; i < 3; i++) {
      mins[i] = Math.min(mins[i], p[i]);
      maxs[i] = Math.max(maxs[i], p[i]);
    }
  }
  const dataRange = [
    maxs[0] - mins[0],
    maxs[1] - mins[1],
    maxs[2] - mins[2]
  ];
  const length = norm(dataRange) / 2;

  const colors = [0xcc3333, 0x33aa33, 0xaa33aa];

  for (let i = 0; i < 3; i++) {
    const v = scale(components[i], length);
    const p1 = sub(mu, v);
    const p2 = add(mu, v);

    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...p1),
      new THREE.Vector3(...p2)
    ]);

    const lineMat = new THREE.LineBasicMaterial({
      color: colors[i],
      linewidth: 3
    });

    scene.add(new THREE.Line(lineGeom, lineMat));
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// -------------------------
// Main
// -------------------------
// (async function () {
//   const points = (await loadCSV("./PCAPoints3D.csv")).slice(0, 80);
//   const { mean, components } = pca3(points);
//   buildScene(points, mean, components);
// })();
