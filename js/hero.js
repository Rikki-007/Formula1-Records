// ============================================================
// 3D hero — a low-poly Formula 1 car built from primitives.
// Drag to rotate. Repaints when the team accent changes.
// ============================================================
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let renderer, scene, camera, controls, carBody = [], wheels = [], raf;

export function initHero(canvas, initialColor = "#e10600") {
  if (!canvas) return;
  dispose(); // clean any previous instance (SPA navigation)

  const w = canvas.clientWidth || 600;
  const h = canvas.clientHeight || 460;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(4.2, 2.4, 5.2);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 4;
  controls.maxDistance = 9;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.1;

  // lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x38bdf8, 30, 40);
  rim.position.set(-6, 3, -4);
  scene.add(rim);

  // ground glow disc
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshBasicMaterial({ color: 0x0b0b14, transparent: true, opacity: 0.85 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = -0.62;
  scene.add(disc);

  const grid = new THREE.GridHelper(14, 28, 0x222233, 0x161622);
  grid.position.y = -0.6;
  scene.add(grid);

  buildCar(initialColor);

  window.addEventListener("accentchange", onAccent);
  window.addEventListener("resize", onResize);

  animate();
}

function buildCar(color) {
  const group = new THREE.Group();
  carBody = [];
  wheels = [];

  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, metalness: 0.4, roughness: 0.6 });
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.1, roughness: 0.9 });

  // main monocoque (tapered)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 3.4), bodyMat);
  chassis.position.y = 0.05;
  group.add(chassis); carBody.push(chassis);

  // nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.3, 4), bodyMat);
  nose.rotation.z = Math.PI;
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0.02, 2.3);
  group.add(nose); carBody.push(nose);

  // cockpit / halo area
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2), darkMat);
  cockpit.position.set(0, 0.26, -0.1);
  group.add(cockpit);

  // engine cover / airbox
  const airbox = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.1, 16), bodyMat);
  airbox.rotation.x = -Math.PI / 2;
  airbox.position.set(0, 0.32, -1.0);
  group.add(airbox); carBody.push(airbox);

  // sidepods
  for (const x of [-0.72, 0.72]) {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 1.5), bodyMat);
    pod.position.set(x, 0.0, -0.2);
    group.add(pod); carBody.push(pod);
  }

  // front wing
  const fWing = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.06, 0.5), bodyMat);
  fWing.position.set(0, -0.25, 2.6);
  group.add(fWing); carBody.push(fWing);
  const fEnd1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.5), darkMat);
  fEnd1.position.set(-1.0, -0.12, 2.6); group.add(fEnd1);
  const fEnd2 = fEnd1.clone(); fEnd2.position.x = 1.0; group.add(fEnd2);

  // rear wing
  const rWing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.1), bodyMat);
  rWing.position.set(0, 0.55, -2.0);
  group.add(rWing); carBody.push(rWing);
  const rPlate1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.6), darkMat);
  rPlate1.position.set(-0.85, 0.5, -1.9); group.add(rPlate1);
  const rPlate2 = rPlate1.clone(); rPlate2.position.x = 0.85; group.add(rPlate2);

  // wheels (fat slick tyres)
  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.4, 28);
  const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.42, 12);
  const wheelPos = [
    [-1.05, -0.2, 1.55], [1.05, -0.2, 1.55],
    [-1.05, -0.2, -1.45], [1.05, -0.2, -1.45],
  ];
  for (const [x, y, z] of wheelPos) {
    const wgrp = new THREE.Group();
    const tyre = new THREE.Mesh(wheelGeo, tyreMat);
    tyre.rotation.z = Math.PI / 2;
    const rimMesh = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.2 }));
    rimMesh.rotation.z = Math.PI / 2;
    wgrp.add(tyre, rimMesh);
    wgrp.position.set(x, y, z);
    group.add(wgrp);
    wheels.push(rimMesh);
  }

  group.rotation.y = Math.PI * 0.12;
  scene.add(group);
  scene.userData.car = group;
}

function onAccent(e) {
  const color = new THREE.Color(e.detail.primary);
  carBody.forEach((m) => m.material.color.copy(color));
  wheels.forEach((m) => m.material.color.copy(color));
}

function onResize() {
  if (!renderer) return;
  const c = renderer.domElement;
  const w = c.clientWidth, h = c.clientHeight;
  if (w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate() {
  raf = requestAnimationFrame(animate);
  controls?.update();
  renderer?.render(scene, camera);
}

export function dispose() {
  cancelAnimationFrame(raf);
  window.removeEventListener("accentchange", onAccent);
  window.removeEventListener("resize", onResize);
  controls?.dispose();
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
  renderer = scene = camera = controls = null;
  carBody = []; wheels = [];
}