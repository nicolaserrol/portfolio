// Hero background scene. Owned by the hero-scene workstream.
// Renders a slowly rotating wireframe icosahedron plus a muted particle field
// behind the hero text, with mouse-driven parallax and idle motion.
// main.js only calls initHeroScene() when prefers-reduced-motion allows it.
import * as THREE from 'three';

const MOBILE_BREAKPOINT = 768;
const PARTICLE_COUNT = 1500;
const LERP = 0.06;

export async function initHeroScene(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch (err) {
    canvas.classList.add('hero-canvas--fallback');
    return;
  }

  const parent = canvas.parentElement || canvas;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  renderer.setClearColor(0x0f172a, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Wireframe icosahedron — kept off-center right on wide screens so it never
  // sits under the hero copy; centered and dimmed on mobile.
  const icosahedron = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.2, 1),
    new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    })
  );
  scene.add(icosahedron);

  // Particle field: muted slate with a sparse tint of accent green.
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const slate = new THREE.Color(0x94a3b8);
  const accent = new THREE.Color(0x4ade80);
  const mixed = new THREE.Color();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const idx = i * 3;
    positions[idx] = (Math.random() - 0.5) * 42;
    positions[idx + 1] = (Math.random() - 0.5) * 30;
    positions[idx + 2] = (Math.random() - 0.5) * 34 - 6;
    mixed.copy(slate).lerp(accent, Math.random() < 0.22 ? Math.random() * 0.9 + 0.1 : 0);
    colors[idx] = mixed.r;
    colors[idx + 1] = mixed.g;
    colors[idx + 2] = mixed.b;
  }
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  scene.add(particles);

  const mouse = { x: 0, y: 0 };
  const cameraTarget = { x: 0, y: 0 };
  const tilt = { x: 0, y: 0 };
  const tiltTarget = { x: 0, y: 0 };
  let baseRotX = 0;
  let baseRotY = 0;

  function onPointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    // Camera drift gives real depth parallax between the near icosahedron
    // and the far particle field via perspective projection.
    cameraTarget.x = mouse.x * 1.1;
    cameraTarget.y = -mouse.y * 0.7;
    tiltTarget.x = -mouse.y * 0.35;
    tiltTarget.y = mouse.x * 0.45;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function layout() {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    icosahedron.position.x = isMobile ? 0 : 4.4;
    icosahedron.position.y = isMobile ? 1.6 : 0.4;
    icosahedron.material.opacity = isMobile ? 0.16 : 0.32;
  }

  function resize() {
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    layout();
  }
  resize();

  let resizeObserver;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(parent);
  } else {
    window.addEventListener('resize', resize);
  }

  let visible = true;

  function onVisibilityChange() {
    if (document.hidden) stop();
    else if (visible) start();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (typeof IntersectionObserver !== 'undefined') {
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0] ? entries[0].isIntersecting : true;
        if (visible) start();
        else stop();
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(parent);
  }

  let rafId = null;
  const clock = new THREE.Clock();

  function animate() {
    rafId = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);

    baseRotX += delta * 0.045;
    baseRotY += delta * 0.07;
    tilt.x += (tiltTarget.x - tilt.x) * LERP;
    tilt.y += (tiltTarget.y - tilt.y) * LERP;
    icosahedron.rotation.x = baseRotX + tilt.x;
    icosahedron.rotation.y = baseRotY + tilt.y;

    particles.rotation.y += delta * 0.012;
    particles.rotation.x = tilt.x * 0.3;

    camera.position.x += (cameraTarget.x - camera.position.x) * LERP;
    camera.position.y += (cameraTarget.y - camera.position.y) * LERP;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function start() {
    if (rafId !== null || document.hidden || !visible) return;
    clock.getDelta();
    rafId = requestAnimationFrame(animate);
  }
  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  start();
}
