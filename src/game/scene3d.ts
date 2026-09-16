import * as THREE from "three";
import type { Atlas } from "./assets";
import {
  CELL_H,
  CELL_W,
  COLS,
  ENEMIES,
  PROP_PLACEMENTS,
  ROWS,
  WORLD_H,
  WORLD_W,
  isBuildableCell,
  PLOTS,
  cellCenter,
  pointOnPath,
  towerStats,
} from "./config";
import type { GameSim, TowerKind } from "./types";

const SCALE = 1 / 48;
const WX = WORLD_W * SCALE;
const WZ = WORLD_H * SCALE;

export function to3(x: number, y: number, h = 0) {
  return new THREE.Vector3((x - WORLD_W * 0.5) * SCALE, h, (y - WORLD_H * 0.5) * SCALE);
}

export function from3(v: THREE.Vector3) {
  return { x: v.x / SCALE + WORLD_W * 0.5, y: v.z / SCALE + WORLD_H * 0.5 };
}

function mat(color: number, opts: { r?: number; m?: number; e?: number; ec?: number; o?: number } = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.r ?? 0.46,
    metalness: opts.m ?? 0.08,
    emissive: opts.ec ?? 0x000000,
    emissiveIntensity: opts.e ?? 0,
    transparent: (opts.o ?? 1) < 1,
    opacity: opts.o ?? 1,
  });
}

function add(
  p: THREE.Object3D,
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
  rx = 0,
  ry = 0,
  rz = 0,
  cast = true,
) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  p.add(mesh);
  return mesh;
}

function geos() {
  return {
    cap: new THREE.CapsuleGeometry(0.16, 0.22, 4, 8),
    capS: new THREE.CapsuleGeometry(0.1, 0.14, 3, 7),
    capT: new THREE.CapsuleGeometry(0.2, 0.34, 4, 8),
    sph: new THREE.SphereGeometry(0.14, 12, 10),
    sphS: new THREE.SphereGeometry(0.055, 10, 8),
    sphL: new THREE.SphereGeometry(0.22, 12, 10),
    cone: new THREE.ConeGeometry(0.07, 0.2, 7),
    coneM: new THREE.ConeGeometry(0.12, 0.36, 7),
    cyl: new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8),
    cylT: new THREE.CylinderGeometry(0.07, 0.09, 1.05, 8),
    box: new THREE.BoxGeometry(0.18, 0.18, 0.18),
    boxL: new THREE.BoxGeometry(1, 0.1, 0.16),
    tor: new THREE.TorusGeometry(0.2, 0.028, 7, 14, Math.PI),
    drum: new THREE.CylinderGeometry(0.38, 0.38, 0.34, 16),
    ico: new THREE.IcosahedronGeometry(0.22, 0),
    plane: new THREE.PlaneGeometry(1, 1),
    disk: new THREE.CircleGeometry(0.28, 16),
    ring: new THREE.RingGeometry(0.36, 0.46, 24),
  };
}

type Geos = ReturnType<typeof geos>;

function makePalette() {
  return {
    skin: mat(0xc43a32, { r: 0.5 }),
    skinDark: mat(0x7a241c, { r: 0.52 }),
    cloth: mat(0xf4eee6, { r: 0.62 }),
    hakama: mat(0xc43d70, { r: 0.55 }),
    hair: mat(0x1a1216, { r: 0.38 }),
    wood: mat(0x6b4423, { r: 0.74 }),
    gold: mat(0xe8c9a0, { r: 0.28, m: 0.62, e: 0.1, ec: 0x6a4a20 }),
    stone: mat(0xb7a48a, { r: 0.8, m: 0.02 }),
    stoneDark: mat(0x6e5c48, { r: 0.84 }),
    vermilion: mat(0xc4452d, { r: 0.42 }),
    lacquer: mat(0x7a1f1a, { r: 0.32, m: 0.2 }),
    bronze: mat(0xb08a4a, { r: 0.34, m: 0.72 }),
    tengu: mat(0x2a2428, { r: 0.48 }),
    wing: mat(0x1c1a22, { r: 0.55 }),
    fox: mat(0xf4efe6, { r: 0.42 }),
    foxTip: mat(0xe85a8a, { r: 0.4, e: 0.25, ec: 0xe85a8a }),
    fire: mat(0xff8a3a, { r: 0.3, e: 1.3, ec: 0xff6a1a }),
    ghost: mat(0xdce8f0, { r: 0.28, e: 0.4, ec: 0xa8c4d8, o: 0.72 }),
    armor: mat(0x3a353c, { r: 0.36, m: 0.55 }),
    paper: mat(0xf7f0e4, { r: 0.55, e: 0.08, ec: 0xe8c9a0 }),
    eye: mat(0xffe9a0, { r: 0.22, e: 0.55, ec: 0xffc14d }),
    shadow: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }),
  };
}

type Pal = ReturnType<typeof makePalette>;

function blob(g: Geos, p: Pal) {
  const m = new THREE.Mesh(g.disk, p.shadow);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.015;
  m.renderOrder = 1;
  return m;
}

function humanoid(g: Geos, p: Pal, body: THREE.Material, s = 1) {
  const fig = new THREE.Group();
  add(fig, g.cap, body, 0, 0.36 * s, 0, s, s * 1.05, s);
  add(fig, g.sph, p.hair, 0, 0.58 * s, 0.02 * s, 0.95 * s, 0.9 * s, 1 * s);
  add(fig, g.sphS, p.eye, -0.055 * s, 0.56 * s, 0.12 * s, s, s, s, 0, 0, 0, false);
  add(fig, g.sphS, p.eye, 0.055 * s, 0.56 * s, 0.12 * s, s, s, s, 0, 0, 0, false);
  add(fig, g.cyl, body, -0.07 * s, 0.12 * s, 0, 0.55 * s, 0.5 * s, 0.55 * s);
  add(fig, g.cyl, body, 0.07 * s, 0.12 * s, 0, 0.55 * s, 0.5 * s, 0.55 * s);
  add(fig, g.box, body, -0.07 * s, 0.03 * s, 0.02 * s, 0.7 * s, 0.35 * s, 1.1 * s);
  add(fig, g.box, body, 0.07 * s, 0.03 * s, 0.02 * s, 0.7 * s, 0.35 * s, 1.1 * s);
  add(fig, g.cyl, body, -0.2 * s, 0.38 * s, 0, 0.4 * s, 0.45 * s, 0.4 * s, 0, 0, 0.9);
  add(fig, g.cyl, body, 0.2 * s, 0.38 * s, 0, 0.4 * s, 0.45 * s, 0.4 * s, 0, 0, -0.9);
  return fig;
}

function withShadow(root: THREE.Group, g: Geos, p: Pal, scale = 1) {
  const sh = blob(g, p);
  sh.scale.setScalar(scale);
  root.add(sh);
  return root;
}

function makeImp(g: Geos, p: Pal) {
  const root = new THREE.Group();
  const fig = humanoid(g, p, p.skin, 0.9);
  add(fig, g.cone, p.gold, -0.07, 0.72, 0, 1, 1, 1, 0.2);
  add(fig, g.cone, p.gold, 0.07, 0.72, 0, 1, 1, 1, -0.2);
  root.add(fig);
  return withShadow(root, g, p, 0.7);
}

function makeTengu(g: Geos, p: Pal) {
  const root = new THREE.Group();
  const fig = humanoid(g, p, p.tengu, 1.05);
  add(fig, g.cone, p.skinDark, 0, 0.54, 0.16, 0.7, 1.35, 0.7, Math.PI / 2);
  add(fig, g.plane, p.wing, -0.32, 0.42, -0.04, 0.5, 0.65, 1, 0.15, 0.45, 0.5);
  add(fig, g.plane, p.wing, 0.32, 0.42, -0.04, 0.5, 0.65, 1, 0.15, -0.45, -0.5);
  root.add(fig);
  return withShadow(root, g, p, 0.8);
}

function makeOni(g: Geos, p: Pal) {
  const root = new THREE.Group();
  const fig = humanoid(g, p, p.skin, 1.28);
  add(fig, g.coneM, p.gold, -0.1, 0.88, 0, 1, 1, 1, 0.22);
  add(fig, g.coneM, p.gold, 0.1, 0.88, 0, 1, 1, 1, -0.22);
  add(fig, g.cyl, p.bronze, 0.28, 0.4, 0.08, 0.65, 1.25, 0.65, 0.45, 0, 0.55);
  add(fig, g.sph, p.bronze, 0.28, 0.68, 0.2, 0.85, 0.85, 0.85);
  root.add(fig);
  return withShadow(root, g, p, 1);
}

function makeYurei(g: Geos, p: Pal) {
  const root = new THREE.Group();
  add(root, g.capT, p.ghost, 0, 0.48, 0, 0.85, 1.05, 0.85, 0, 0, 0, false);
  add(root, g.sph, p.ghost, 0, 0.9, 0, 0.95, 0.95, 0.95, 0, 0, 0, false);
  add(root, g.sphS, p.eye, -0.06, 0.92, 0.12, 0.85, 0.85, 0.85, 0, 0, 0, false);
  add(root, g.sphS, p.eye, 0.06, 0.92, 0.12, 0.85, 0.85, 0.85, 0, 0, 0, false);
  return withShadow(root, g, p, 0.55);
}

function makeBoss(g: Geos, p: Pal) {
  const root = new THREE.Group();
  const fig = humanoid(g, p, p.armor, 1.55);
  add(fig, g.box, p.gold, 0, 0.5, 0.12, 1.5, 0.32, 0.22);
  add(fig, g.coneM, p.gold, -0.14, 1.05, 0, 1.05, 1.15, 1.05, 0.22);
  add(fig, g.coneM, p.gold, 0.14, 1.05, 0, 1.05, 1.15, 1.05, -0.22);
  add(fig, g.boxL, p.lacquer, 0, 0.32, 0, 0.65, 2, 0.85);
  root.add(fig);
  return withShadow(root, g, p, 1.25);
}

function plinth(g: Geos, p: Pal, s = 1) {
  const root = new THREE.Group();
  add(root, g.cyl, p.stone, 0, 0.07 * s, 0, 2.1 * s, 0.26 * s, 2.1 * s);
  add(root, g.cyl, p.stoneDark, 0, 0.018 * s, 0, 2.5 * s, 0.07 * s, 2.5 * s, 0, 0, 0, false);
  return root;
}

function makeYumi(g: Geos, p: Pal) {
  const root = plinth(g, p, 1);
  const fig = humanoid(g, p, p.cloth, 0.95);
  add(fig, g.box, p.hakama, 0, 0.22, 0, 1.15, 1.4, 0.9);
  add(fig, g.tor, p.wood, 0.18, 0.46, 0.1, 1.25, 1.25, 1.25, 0, 0, -0.35);
  add(fig, g.cyl, p.wood, 0.22, 0.52, 0.04, 0.22, 1.05, 0.22, 0, 0, 0.45);
  fig.position.y = 0.12;
  root.add(fig);
  return withShadow(root, g, p, 1.05);
}

function makeOfuda(g: Geos, p: Pal) {
  const root = plinth(g, p, 0.92);
  add(root, g.box, p.wood, 0, 0.28, 0, 2.1, 1.05, 1.35);
  add(root, g.box, p.gold, 0, 0.4, 0.1, 1.5, 0.12, 0.28);
  add(root, g.box, p.paper, -0.15, 0.6, 0.08, 0.45, 1.35, 0.1, 0, 0, -0.12, false);
  add(root, g.box, p.paper, 0.02, 0.68, 0.1, 0.45, 1.55, 0.1, 0, 0, 0.08, false);
  add(root, g.box, p.paper, 0.16, 0.62, 0.06, 0.45, 1.25, 0.1, 0, 0, 0.18, false);
  return withShadow(root, g, p, 1);
}

function makeKitsune(g: Geos, p: Pal) {
  const root = plinth(g, p, 0.88);
  add(root, g.box, p.stoneDark, 0, 0.36, 0, 1.05, 1.5, 1.05);
  add(root, g.box, p.stone, 0, 0.58, 0, 1.5, 0.22, 1.5);
  add(root, g.sphS, p.fire, 0, 0.5, 0, 1.5, 1.7, 1.5, 0, 0, 0, false);
  const fox = new THREE.Group();
  add(fox, g.capS, p.fox, 0, 0.2, 0.06, 1.15, 1, 1.45);
  add(fox, g.sphS, p.fox, 0, 0.32, 0.2, 1.35, 1.15, 1.25);
  add(fox, g.cone, p.fox, -0.05, 0.42, 0.16, 0.65, 0.75, 0.65, 0.4);
  add(fox, g.cone, p.fox, 0.05, 0.42, 0.16, 0.65, 0.75, 0.65, -0.4);
  add(fox, g.cone, p.foxTip, 0, 0.14, -0.2, 0.65, 1.3, 0.65, 1.15);
  add(fox, g.cone, p.foxTip, -0.07, 0.16, -0.18, 0.5, 1.1, 0.5, 1.0, 0.28);
  add(fox, g.cone, p.foxTip, 0.07, 0.16, -0.18, 0.5, 1.1, 0.5, 1.0, -0.28);
  fox.position.set(0.26, 0.52, 0.1);
  fox.rotation.y = -0.55;
  root.add(fox);
  return withShadow(root, g, p, 1);
}

function makeTaiko(g: Geos, p: Pal) {
  const root = plinth(g, p, 1.12);
  add(root, g.drum, p.lacquer, 0, 0.4, 0, 1.12, 1.12, 1.12);
  add(root, g.cyl, p.gold, 0, 0.56, 0, 3.5, 0.07, 3.5, 0, 0, 0, false);
  add(root, g.cyl, p.gold, 0, 0.24, 0, 3.5, 0.07, 3.5, 0, 0, 0, false);
  add(root, g.cylT, p.bronze, -0.36, 0.52, 0, 0.65, 0.65, 0.65);
  add(root, g.cylT, p.bronze, 0.36, 0.52, 0, 0.65, 0.65, 0.65);
  return withShadow(root, g, p, 1.15);
}

function hpKit(y: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(0.85, 0.1, 1);
  sprite.position.y = y;
  sprite.renderOrder = 8;
  return { canvas, ctx, tex, sprite };
}

function paintHp(kit: ReturnType<typeof hpKit>, ratio: number) {
  const { ctx, tex } = kit;
  ctx.clearRect(0, 0, 128, 16);
  ctx.fillStyle = "rgba(8,6,10,0.82)";
  ctx.fillRect(0, 4, 128, 8);
  ctx.fillStyle = ratio > 0.45 ? "#3ecf5a" : ratio > 0.2 ? "#e6b84c" : "#d4453a";
  ctx.fillRect(2, 5, 124 * Math.max(0, ratio), 6);
  ctx.strokeStyle = "rgba(232,201,160,0.55)";
  ctx.strokeRect(0.5, 4.5, 127, 7);
  tex.needsUpdate = true;
}

type Puppet = {
  root: THREE.Group;
  kind: string;
  hp?: ReturnType<typeof hpKit>;
};

export type World3D = {
  pick: (clientX: number, clientY: number) => { x: number; y: number } | null;
  resize: () => void;
  sync: (sim: GameSim, reduced: boolean) => void;
  render: () => void;
  dispose: () => void;
};

export function createWorld3D(canvas: HTMLCanvasElement, atlas: Atlas): World3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0c1014, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1014, 22, 52);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.2, 90);
  camera.position.set(0.2, 15.2, 14.8);
  camera.lookAt(0, 0.1, -0.6);

  scene.add(new THREE.HemisphereLight(0xffe6cc, 0x2a332c, 0.9));
  const sun = new THREE.DirectionalLight(0xffe0c0, 1.45);
  sun.position.set(-9, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x5a6a70, 0.32));
  const fill = new THREE.DirectionalLight(0x88a0b8, 0.28);
  fill.position.set(8, 7, -5);
  scene.add(fill);

  for (const pr of PROP_PLACEMENTS) {
    if (pr.id !== "lantern") continue;
    const lamp = new THREE.PointLight(0xffb060, 0.45, 3.8, 2);
    lamp.position.copy(to3(pr.x, pr.y, 0.5));
    scene.add(lamp);
  }

  const groundTex = new THREE.Texture(atlas.map);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.needsUpdate = true;
  groundTex.minFilter = THREE.LinearFilter;
  groundTex.magFilter = THREE.LinearFilter;
  groundTex.generateMipmaps = false;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WX, WZ),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.94, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(WX * 2.6, WZ * 2.6),
    new THREE.MeshLambertMaterial({ color: 0x1a221c }),
  );
  under.rotation.x = -Math.PI / 2;
  under.position.y = -0.05;
  scene.add(under);

  const g = geos();
  const p = makePalette();

  const pads = new THREE.Group();
  const padMat = new THREE.MeshBasicMaterial({ color: 0xe8c9a0, transparent: true, opacity: 0.26, depthWrite: false });
  for (const plot of PLOTS) {
    const { x, y } = cellCenter(plot.col, plot.row);
    const disk = new THREE.Mesh(g.disk, padMat);
    disk.rotation.x = -Math.PI / 2;
    disk.position.copy(to3(x, y, 0.03));
    pads.add(disk);
  }
  pads.visible = false;
  scene.add(pads);

  const factories: Record<string, () => THREE.Group> = {
    imp: () => makeImp(g, p),
    tengu: () => makeTengu(g, p),
    oni: () => makeOni(g, p),
    yurei: () => makeYurei(g, p),
    boss: () => makeBoss(g, p),
    yumi: () => makeYumi(g, p),
    ofuda: () => makeOfuda(g, p),
    kitsune: () => makeKitsune(g, p),
    taiko: () => makeTaiko(g, p),
  };

  const hpY: Record<string, number> = { imp: 0.95, tengu: 1.1, oni: 1.35, yurei: 1.2, boss: 1.85 };

  const units = new THREE.Group();
  scene.add(units);
  const shots = new THREE.Group();
  scene.add(shots);
  const puppets = new Map<string, Puppet>();
  const pools: Record<string, Puppet[]> = {};
  const shotMesh = new Map<number, THREE.Mesh>();
  const shotGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const shotMats: Record<TowerKind, THREE.MeshBasicMaterial> = {
    yumi: new THREE.MeshBasicMaterial({ color: 0xf3ece4 }),
    ofuda: new THREE.MeshBasicMaterial({ color: 0xe8c9a0 }),
    kitsune: new THREE.MeshBasicMaterial({ color: 0xff8a3a }),
    taiko: new THREE.MeshBasicMaterial({ color: 0xd45b5b }),
  };

  const rangeMat = new THREE.MeshBasicMaterial({
    color: 0xe85a8a,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rangeMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), rangeMat);
  rangeMesh.rotation.x = -Math.PI / 2;
  rangeMesh.visible = false;
  scene.add(rangeMesh);

  const selectRing = new THREE.Mesh(g.ring, new THREE.MeshBasicMaterial({ color: 0xe8c9a0, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  selectRing.rotation.x = -Math.PI / 2;
  selectRing.visible = false;
  scene.add(selectRing);

  const ghost = new THREE.Group();
  ghost.visible = false;
  scene.add(ghost);
  const ghostMat = mat(0xe85a8a, { o: 0.4, r: 0.5 });
  let ghostKind: string | null = null;

  function take(kind: string): Puppet {
    const pool = (pools[kind] ??= []);
    const reused = pool.pop();
    if (reused) {
      reused.root.visible = true;
      units.add(reused.root);
      return reused;
    }
    const root = factories[kind]();
    units.add(root);
    const puppet: Puppet = { root, kind };
    if (kind in ENEMIES) {
      puppet.hp = hpKit(hpY[kind] ?? 1.1);
      root.add(puppet.hp.sprite);
    }
    return puppet;
  }

  function release(pu: Puppet) {
    pu.root.visible = false;
    units.remove(pu.root);
    (pools[pu.kind] ??= []).push(pu);
  }

  function place(obj: THREE.Object3D, x: number, y: number, hover = 0) {
    const v = to3(x, y, hover);
    obj.position.x = v.x;
    obj.position.z = v.z;
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function pick(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(floor, hit)) return null;
    return from3(hit);
  }

  function sync(sim: GameSim, reduced: boolean) {
    const shake = reduced ? 0 : sim.trauma * sim.trauma;
    camera.position.set(0.2 + Math.sin(sim.elapsed * 37) * shake * 0.1, 15.2, 14.8);
    camera.lookAt(0, 0.1, -0.6);

    const live = new Set<string>();

    for (const e of sim.enemies) {
      if (!e.alive) continue;
      const key = `e-${e.id}`;
      live.add(key);
      let pu = puppets.get(key);
      if (!pu) {
        pu = take(e.kind);
        puppets.set(key, pu);
      }
      const bob = reduced ? 0 : e.kind === "yurei" ? Math.sin(e.bob) * 0.07 + 0.1 : Math.abs(Math.sin(e.bob * 2.2)) * 0.035;
      place(pu.root, e.x, e.y, bob);
      const tan = pointOnPath(e.progress);
      pu.root.rotation.y = Math.atan2(tan.tx, tan.ty);
      if (pu.hp) {
        paintHp(pu.hp, e.hp / e.maxHp);
        pu.hp.sprite.visible = e.hp < e.maxHp - 0.4;
      }
    }

    for (const t of sim.towers) {
      const key = `t-${t.id}`;
      live.add(key);
      let pu = puppets.get(key);
      if (!pu) {
        pu = take(t.kind);
        puppets.set(key, pu);
      }
      place(pu.root, t.x, t.y, 0);
      pu.root.scale.setScalar(1 + (t.level - 1) * 0.08);
      const tgt = sim.enemies.find((en) => en.alive && en.id === t.targetId);
      if (tgt) pu.root.rotation.y = Math.atan2(tgt.x - t.x, tgt.y - t.y);
      if (sim.selectedTower === t.id) {
        selectRing.visible = true;
        place(selectRing, t.x, t.y, 0.05);
        const stats = towerStats(t.kind, t.level);
        rangeMesh.visible = true;
        rangeMesh.scale.setScalar(stats.range * SCALE);
        place(rangeMesh, t.x, t.y, 0.04);
      }
    }
    if (!sim.selectedTower) {
      selectRing.visible = false;
      if (!sim.selectedKind) rangeMesh.visible = false;
    }

    pads.visible = !!sim.selectedKind;
    if (sim.selectedKind && sim.hoverCol >= 0) {
      const ok =
        isBuildableCell(sim.hoverCol, sim.hoverRow) &&
        !sim.towers.some((tw) => tw.col === sim.hoverCol && tw.row === sim.hoverRow);
      const x = (sim.hoverCol + 0.5) * CELL_W;
      const y = (sim.hoverRow + 0.5) * CELL_H;
      if (ghostKind !== sim.selectedKind) {
        ghost.clear();
        const body = factories[sim.selectedKind]();
        body.traverse((o) => {
          if (o instanceof THREE.Mesh) o.material = ghostMat;
        });
        ghost.add(body);
        ghostKind = sim.selectedKind;
      }
      ghost.visible = ok;
      place(ghost, x, y, 0.02);
      const stats = towerStats(sim.selectedKind, 1);
      rangeMesh.visible = true;
      rangeMesh.scale.setScalar(stats.range * SCALE);
      rangeMat.opacity = ok ? 0.14 : 0.08;
      rangeMat.color.set(ok ? 0xe85a8a : 0xd45b5b);
      place(rangeMesh, x, y, 0.04);
    } else if (!sim.selectedTower) {
      ghost.visible = false;
    }

    for (const [key, pu] of puppets) {
      if (!live.has(key)) {
        release(pu);
        puppets.delete(key);
      }
    }

    const liveShots = new Set<number>();
    for (const pr of sim.projectiles) {
      if (!pr.alive) continue;
      liveShots.add(pr.id);
      let mesh = shotMesh.get(pr.id);
      if (!mesh) {
        mesh = new THREE.Mesh(shotGeo, shotMats[pr.kind]);
        shots.add(mesh);
        shotMesh.set(pr.id, mesh);
      }
      place(mesh, pr.x, pr.y, 0.45);
    }
    for (const [id, mesh] of shotMesh) {
      if (!liveShots.has(id)) {
        shots.remove(mesh);
        shotMesh.delete(id);
      }
    }
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    renderer.dispose();
    groundTex.dispose();
  }

  resize();
  return { pick, resize, sync, render, dispose };
}
