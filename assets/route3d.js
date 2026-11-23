// X-Factor: an interactive 3D walk from the Dallas Love Field terminal to Garage C, Level 6, Row G.
// Plain three.js (no build step) so it runs on GitHub Pages. Map data: window.DAL (assets/dal-data.js),
// building footprints © OpenStreetMap contributors. Stylized: garage levels are not to scale.
import * as THREE from "three";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const D = window.DAL;
const root = document.getElementById("walk3d");
const stage = root.querySelector(".w3-stage");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── constants & route ─────────────────────────────── */
const AMBER = new THREE.Color("#ffb45e");
const BONE = new THREE.Color("#eee9e0");
const LEVEL_H = 3.3;
const ENTRY_LEVEL = 3, CAR_LEVEL = 6;
const levelY = (l) => (l === -1 ? -LEVEL_H : (l - 1) * LEVEL_H);
const WALK_Y = levelY(ENTRY_LEVEL);
const ROOF_Y = levelY(8);

const STEPS = [
  { at: 0, label: "Exit", title: "Walk out to the main lobby. Skip the rental counters and shuttles." },
  { at: 1, label: "Garage C signs", title: "Follow the signs for Garage C, heading east toward ticketing." },
  { at: 3, label: "Skybridge → L3", title: "Take the skybridge. It brings you into Garage C on Level 3." },
  { at: 5, label: "Elevator → L6", title: "Ride the elevator from Level 3 up to Level 6." },
  { at: 9, label: "Row G", title: "Level 6, Row G, at the beginning of the row. Your car is waiting." },
];

const PTS = D.path.map(([x, y, l]) => new THREE.Vector3(x, (l === "T" ? WALK_Y : levelY(l)) + 0.6, -y));
const cum = [0];
for (let i = 1; i < PTS.length; i++) cum.push(cum[i - 1] + PTS[i].distanceTo(PTS[i - 1]));
const TOTAL = cum.at(-1);
const T = cum.map((d) => d / TOTAL); // 0..1 at each path vertex
const STEP_T = STEPS.map((s) => T[s.at]);

// Approximate elapsed walking time (1.1 m/s with luggage, +60 s for the elevator) and horizontal distance.
const secs = [0], horiz = [0];
for (let i = 1; i < D.path.length; i++) {
  const [ax, ay] = D.path[i - 1], [bx, by] = D.path[i];
  const h = Math.hypot(bx - ax, by - ay);
  horiz.push(horiz[i - 1] + h);
  secs.push(secs[i - 1] + (h < 0.01 ? 60 : h / 1.1));
}
// Scale to the published ~5-minute walk (same as the main site), so the clock never promises a shorter walk.
const WALK_SECS = 5 * 60;
for (let i = 0; i < secs.length; i++) secs[i] = (secs[i] / secs.at(-1)) * WALK_SECS;
const TOTAL_FT = Math.round((horiz.at(-1) * 3.28084) / 50) * 50;

/** Point + vertex index at route fraction p. */
function at(p) {
  let i = 1;
  while (i < T.length - 1 && T[i] < p) i++;
  const f = THREE.MathUtils.clamp((p - T[i - 1]) / Math.max(1e-6, T[i] - T[i - 1]), 0, 1);
  return { i, f, v: PTS[i - 1].clone().lerp(PTS[i], f) };
}

/* ── renderer, scene, camera ───────────────────────── */
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.AgXToneMapping;
renderer.domElement.className = "w3-canvas";

const labels = new CSS2DRenderer();
labels.domElement.className = "w3-labels";
stage.prepend(labels.domElement);
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#07080a");
scene.fog = new THREE.Fog("#07080a", 260, 1100);
const camera = new THREE.PerspectiveCamera(34, 1, 1, 3000);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const sun = new THREE.DirectionalLight(0xfff1dc, 1.5);
sun.position.set(-120, 260, 160);
scene.add(sun);

/* ── helpers ───────────────────────────────────────── */
function block(footprint, height, { y0 = 0, fill = "#1b1d23", fillOpacity = 0.95, edge = BONE, edgeOpacity = 0.3 } = {}) {
  const shape = new THREE.Shape(footprint.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y0, 0);
  const fillMat = new THREE.MeshLambertMaterial({ color: fill, transparent: true, opacity: fillOpacity, depthWrite: fillOpacity > 0.5 });
  const edgeMat = new THREE.LineBasicMaterial({ color: edge, transparent: true, opacity: edgeOpacity });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, fillMat), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat));
  scene.add(g);
  return { fillMat, edgeMat };
}

function line(points, { color = BONE, opacity = 0.2, dashed = false } = {}) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 2.4, gapSize: 2.4 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const l = new THREE.Line(geo, mat);
  if (dashed) l.computeLineDistances();
  scene.add(l);
  return l;
}

function label(text, pos, cls = "w3-place") {
  const el = document.createElement("div");
  el.className = cls;
  el.textContent = text;
  const o = new CSS2DObject(el);
  o.position.copy(pos);
  scene.add(o);
  return el;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTexture();
const B = Object.fromEntries(D.buildings.map((b) => [b.id, b]));
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

/* ── ground, roads, runways ────────────────────────── */
{
  const gy = -LEVEL_H - 0.2;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({ color: "#08090b" }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = gy - 0.05;
  scene.add(ground);
  const arr = [];
  for (let v = -1400; v <= 1400; v += 25) arr.push(v, gy, -1400, v, gy, 1400, -1400, gy, v, 1400, gy, v);
  const grid = new THREE.BufferGeometry();
  grid.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  scene.add(new THREE.LineSegments(grid, new THREE.LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.06 })));
}
D.roads.forEach((r) =>
  line(r.line.map(([x, y]) => v3(x, r.layer < 0 ? -0.9 : 0.1, -y)), { opacity: r.layer < 0 ? 0.08 : 0.15, dashed: r.layer < 0 })
);
{
  const byRef = new Map();
  for (const r of D.runways) byRef.set(r.ref, [...(byRef.get(r.ref) || []), ...r.line]);
  const pts = [];
  for (const ln of byRef.values()) {
    let a = ln[0], b = ln[0], best = 0;
    for (const p of ln) for (const q of ln) {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d > best) [best, a, b] = [d, p, q];
    }
    const dx = (b[0] - a[0]) / best, dy = (b[1] - a[1]) / best, nx = -dy * 23, ny = dx * 23;
    for (let d = 0; d <= best; d += 30) {
      const x = a[0] + dx * d, y = a[1] + dy * d;
      pts.push(x + nx, 0.5, -(y + ny), x - nx, 0.5, -(y - ny));
      if ((d / 30) % 2 === 0) pts.push(x, 0.5, -y);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    map: GLOW, color: "#ffe2b8", size: 5, sizeAttenuation: true, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  })));
}

/* ── buildings ─────────────────────────────────────── */
["terminal", "ticketing", "baggage", "rental-counters"].forEach((id) => B[id] && block(B[id].footprint, id === "terminal" ? 14 : 11));
B.concourse && block(B.concourse.footprint, 10, { edgeOpacity: 0.14 });
D.jetBridges.forEach((l) => line(l.map(([x, y]) => v3(x, 6, -y)), { opacity: 0.25 }));
B.connector && block(B.connector.footprint, 4.6, { y0: WALK_Y - 1, fill: AMBER, fillOpacity: 0.07, edge: AMBER, edgeOpacity: 0.55 });
B["garage-c-core"] && block(B["garage-c-core"].footprint, ROOF_Y + 2, { fill: "#101116", fillOpacity: 0.55, edge: AMBER, edgeOpacity: 0.22 });
["garage-a", "garage-b"].forEach((id) =>
  B[id] && [1, 2, 3, 4].forEach((l) => block(B[id].footprint, 0.35, { y0: levelY(l), fillOpacity: 0.5, edgeOpacity: 0.09 }))
);
D.buildings.filter((b) => b.kind === "context").forEach((b) => block(b.footprint, 8, { fillOpacity: 0.6, edgeOpacity: 0.07 }));

// Garage C: every level as a slab; Level 6 lights up once you reach the elevator.
const garage = {};
if (B["garage-c"]) {
  const fp = B["garage-c"].footprint;
  [-1, 1, 2, 3, 4, 5, 6, 7, 8].forEach((l) => {
    garage[l] = block(fp, 0.4, {
      y0: levelY(l),
      fill: "#1d2026",
      fillOpacity: l === -1 ? 0.25 : 0.42,
      edge: l === CAR_LEVEL || l === ENTRY_LEVEL ? AMBER : BONE,
      edgeOpacity: l === CAR_LEVEL ? 0.55 : l === ENTRY_LEVEL ? 0.45 : 0.26,
    });
  });
  const arr = [];
  fp.forEach(([x, y]) => arr.push(x, levelY(-1), -y, x, ROOF_Y + 0.4, -y));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: BONE, transparent: true, opacity: 0.12 })));
  label("L3", v3(fp[0][0] - 6, levelY(ENTRY_LEVEL) + 1.2, -fp[0][1] + 4), "w3-level");
  garage.l6Label = label("L6", v3(fp[0][0] - 6, levelY(CAR_LEVEL) + 1.2, -fp[0][1] + 4), "w3-level");
}

label("Main lobby", v3(-110, 22, -60));
label("Gates 1–20", v3(-60, 18, -310));
label("Garage C", v3(205, ROOF_Y + 9, 5), "w3-place strong");
label("Garage A", v3(-40, 8, 40));

/* ── route, walker, step markers, Row G pin ────────── */
line(PTS, { opacity: 0.3, dashed: true });

const curve = new THREE.CurvePath();
for (let i = 1; i < PTS.length; i++) curve.add(new THREE.LineCurve3(PTS[i - 1], PTS[i]));
const SEG = 700, RAD = 6;
const tubeGeo = new THREE.TubeGeometry(curve, SEG, 0.6, RAD, false);
const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: AMBER, toneMapped: false }));
tubeGeo.setDrawRange(0, 0);
scene.add(tube);

const walker = new THREE.Group();
walker.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 14), new THREE.MeshBasicMaterial({ color: "#fff2de", toneMapped: false })));
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: AMBER, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
halo.scale.set(26, 26, 1);
walker.add(halo);
const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 40), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.6, depthWrite: false }));
ring.rotation.x = -Math.PI / 2;
ring.position.y = -0.55;
walker.add(ring);
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 28, 8, 1, true), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
beam.position.y = 14;
walker.add(beam);
scene.add(walker);

const markers = STEPS.slice(0, -1).map((s, i) => {
  const m = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 40), new THREE.MeshBasicMaterial({ color: BONE, transparent: true, opacity: 0.3 }));
  m.rotation.x = -Math.PI / 2;
  m.position.copy(PTS[s.at]).add(v3(0, -0.5, 0));
  scene.add(m);
  const el = label(`${String(i + 1).padStart(2, "0")} · ${s.label}`, PTS[s.at].clone().add(v3(0, 7, 0)), "w3-step");
  return { m, el };
});

const end = PTS.at(-1);
const pin = new THREE.Group();
pin.position.copy(end);
const bay = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.2), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.1, depthWrite: false }));
bay.rotation.x = -Math.PI / 2;
bay.position.y = -0.45;
const pulse = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 48), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.4, depthWrite: false }));
pulse.rotation.x = -Math.PI / 2;
pulse.position.y = -0.4;
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 10, 8), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.45 }));
pole.position.y = 5;
const head = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: BONE, toneMapped: false }));
head.position.y = 10.4;
pin.add(bay, pulse, pole, head);
scene.add(pin);
const pinLabel = label("Garage C · L6 · Row G", end.clone().add(v3(0, 15, 0)), "w3-pin");

/* ── camera choreography (one shot per step) ───────── */
const SHOTS = [
  { dist: 430, elev: 50, az: 118 },
  { dist: 390, elev: 46, az: 124 },
  { dist: 330, elev: 40, az: 132 },
  { dist: 190, elev: 16, az: 150, lift: 6 },
  { dist: 245, elev: 52, az: 126 },
];
const CENTER = PTS.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(PTS.length);
const look = new THREE.Vector3();
let firstFrame = true;
let dragAz = 0, dragEl = 0;

function shotAt(p) {
  let k = 0;
  while (k < STEP_T.length - 2 && STEP_T[k + 1] <= p) k++;
  return k + THREE.MathUtils.clamp((p - STEP_T[k]) / Math.max(1e-6, STEP_T[k + 1] - STEP_T[k]), 0, 1);
}

function placeCamera(p, dt) {
  const s = shotAt(p);
  const k = Math.min(Math.floor(s), SHOTS.length - 2), f = s - k;
  const a = SHOTS[k], b = SHOTS[k + 1], L = THREE.MathUtils.lerp, rad = THREE.MathUtils.degToRad;
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  const dist = L(a.dist, b.dist, f) * (aspect < 1 ? 1.6 : aspect < 1.4 ? 1.2 : 1);
  const elev = rad(THREE.MathUtils.clamp(L(a.elev, b.elev, f) + dragEl, 8, 80));
  const az = rad(L(a.az, b.az, f) + dragAz);
  const lift = L(a.lift || 0, b.lift || 0, f);
  const focus = at(p).v.add(v3(0, lift, 0));
  let w = THREE.MathUtils.clamp(s / (SHOTS.length - 1), 0, 1) * 0.6 + 0.25;
  if (aspect < 1) w = Math.min(1, w + 0.2 * (s / (SHOTS.length - 1))); // phones: keep the walker (and Row G) centered
  const c = CENTER.clone().lerp(focus, w);
  const want = v3(c.x + Math.cos(az) * Math.cos(elev) * dist, c.y + Math.sin(elev) * dist, c.z + Math.sin(az) * Math.cos(elev) * dist);
  if (firstFrame || reduced) {
    camera.position.copy(want);
    look.copy(c);
    firstFrame = false;
  } else {
    const k2 = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(want, k2);
    look.lerp(c, k2);
  }
  camera.lookAt(look);
}

/* ── UI: HUD, step buttons, play ───────────────────── */
const clockEl = root.querySelector("[data-w3=clock]");
const feetEl = root.querySelector("[data-w3=feet]");
const barEl = root.querySelector("[data-w3=bar]");
const captionEl = root.querySelector("[data-w3=caption]");
const playBtn = root.querySelector(".w3-play");
const stepBtns = [...root.querySelectorAll(".w3-steps button")];
root.querySelector("[data-w3=total]").textContent = TOTAL_FT.toLocaleString();

let progress = 0;   // 0..1 along the route
let activeStep = -1;
let anim = null;    // { keys: [{p, t}], start }

function setActive(i) {
  if (i === activeStep) return;
  activeStep = i;
  stepBtns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
  markers.forEach(({ m, el }, k) => {
    m.material.color.copy(k <= i ? AMBER : BONE);
    m.material.opacity = k === i ? 1 : k < i ? 0.6 : 0.3;
    el.classList.toggle("on", k === i);
    el.classList.toggle("done", k < i);
  });
  const l6 = i >= 3; // reached the elevator → highlight Level 6, cut away the levels above it
  if (garage[CAR_LEVEL]) {
    garage[CAR_LEVEL].fillMat.color.copy(l6 ? AMBER : new THREE.Color("#1d2026"));
    garage[CAR_LEVEL].fillMat.opacity = l6 ? 0.12 : 0.42;
    garage[CAR_LEVEL].edgeMat.opacity = l6 ? 1 : 0.55;
    [7, 8].forEach((l) => {
      garage[l].fillMat.opacity = l6 ? 0.04 : 0.42;
      garage[l].edgeMat.opacity = l6 ? 0.07 : 0.26;
    });
    garage.l6Label?.classList.toggle("on", l6);
  }
  const arrived = i === STEPS.length - 1;
  pinLabel.classList.toggle("on", arrived);
  head.material.color.copy(arrived ? AMBER : BONE);
  pole.material.opacity = arrived ? 0.9 : 0.45;
  bay.material.opacity = arrived ? 0.28 : 0.1;
  captionEl.innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b> ${STEPS[i].title}`;
}

function updateHud(p) {
  const { i, f } = at(p);
  const sec = secs[i - 1] + (secs[i] - secs[i - 1]) * f;
  clockEl.textContent = `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
  const h = (horiz[i - 1] + (horiz[i] - horiz[i - 1]) * f) / horiz.at(-1);
  feetEl.textContent = (Math.round((h * TOTAL_FT) / 10) * 10).toLocaleString();
  barEl.style.transform = `scaleX(${h.toFixed(3)})`;
  let s = 0;
  for (let k = 0; k < STEP_T.length; k++) if (p >= STEP_T[k] - 0.003) s = k;
  setActive(s);
}

const ease = (x) => x * x * (3 - 2 * x);

/** Animate along a list of {p, dur, hold} legs. */
function run(legs) {
  if (reduced) { progress = legs.at(-1).p; anim = null; return; }
  let t = 0;
  const keys = [];
  let from = progress;
  for (const leg of legs) {
    keys.push({ from, to: leg.p, t0: t, t1: t + leg.dur });
    t += leg.dur + (leg.hold || 0);
    from = leg.p;
  }
  anim = { keys, start: performance.now(), total: t };
  playBtn.textContent = "Playing…";
}

function play() {
  progress = 0;
  firstFrame = false;
  run(STEPS.slice(1).map((s, k) => ({ p: STEP_T[k + 1], dur: 1.1 + 9 * (STEP_T[k + 1] - STEP_T[k]), hold: 0.9 })));
}

playBtn.addEventListener("click", () => { dragAz = dragEl = 0; play(); });
stepBtns.forEach((b, k) => b.addEventListener("click", () => run([{ p: STEP_T[k], dur: 1.2 }])));

// Drag (or swipe sideways) to look around; double-click to reset the view.
let drag = null;
stage.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, az: dragAz, el: dragEl }; });
addEventListener("pointermove", (e) => {
  if (!drag) return;
  dragAz = drag.az + (e.clientX - drag.x) * 0.3;
  dragEl = THREE.MathUtils.clamp(drag.el + (e.clientY - drag.y) * 0.15, -30, 30);
});
addEventListener("pointerup", () => (drag = null));
addEventListener("pointercancel", () => (drag = null));
stage.addEventListener("dblclick", () => { dragAz = dragEl = 0; });

/* ── loop, resize, visibility ──────────────────────── */
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  labels.setSize(w, h);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

let visible = false, played = false, last = performance.now();
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible && !played && e.intersectionRatio > 0.3) { played = true; play(); }
}, { threshold: [0, 0.3, 0.6] }).observe(stage);

const clock = new THREE.Clock();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!visible) return;

  if (anim) {
    const t = (now - anim.start) / 1000;
    const k = anim.keys.find((kk) => t < kk.t1 + 1e-6 && t >= kk.t0) || anim.keys.find((kk) => t < kk.t0);
    if (t >= anim.total) { progress = anim.keys.at(-1).to; anim = null; playBtn.textContent = "↺ Replay the walk"; }
    else if (k && t >= k.t0) progress = k.from + (k.to - k.from) * ease(THREE.MathUtils.clamp((t - k.t0) / (k.t1 - k.t0), 0, 1));
    else if (k) progress = k.from; // holding at a step
  }

  const { v } = at(progress);
  walker.position.copy(v);
  walker.scale.setScalar(1 - THREE.MathUtils.smoothstep(progress, 0.96, 1) * 0.7);
  tubeGeo.setDrawRange(0, Math.floor(progress * SEG) * RAD * 6);
  updateHud(progress);

  const e = clock.getElapsedTime();
  if (!reduced) {
    const k1 = (e * 0.8) % 1;
    ring.scale.setScalar(1 + k1 * 3.5);
    ring.material.opacity = 0.7 * (1 - k1);
    const k2 = (e * 0.6) % 1;
    pulse.scale.setScalar(1 + k2 * 2.4);
    pulse.material.opacity = (activeStep === STEPS.length - 1 ? 0.8 : 0.4) * (1 - k2);
  }
  placeCamera(progress, dt);
  renderer.render(scene, camera);
  labels.render(scene, camera);
}
requestAnimationFrame(frame);
root.classList.add("w3-ready");
