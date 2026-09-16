export type SpriteTech =
  | "flat"
  | "stack"
  | "slice"
  | "lit"
  | "mini"
  | "vol"
  | "prism"
  | "round"
  | "shell"
  | "march";

export type SdfTech = "prism" | "round" | "shell" | "march";

export const SPRITE_TECHS: { id: SpriteTech; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "stack", label: "Stack" },
  { id: "slice", label: "Slice" },
  { id: "lit", label: "Lit" },
  { id: "mini", label: "Mini" },
  { id: "prism", label: "Prism" },
  { id: "round", label: "Round" },
  { id: "shell", label: "Shell" },
  { id: "march", label: "March" },
];

export function isSdfTech(tech: SpriteTech | undefined): boolean {
  const t = normalizeTech(tech);
  return t === "prism" || t === "round" || t === "shell" || t === "march";
}

export function normalizeTech(tech: SpriteTech | undefined): SpriteTech {
  if (!tech || tech === "vol") return "round";
  return tech;
}

export function nextSpriteTech(tech: SpriteTech): SpriteTech {
  const cur = normalizeTech(tech);
  const i = SPRITE_TECHS.findIndex((t) => t.id === cur);
  return SPRITE_TECHS[(i + 1) % SPRITE_TECHS.length]?.id ?? "round";
}

/** Upper-left lamp, matching the painted miniatures. */
const LIGHT = { x: -0.62, y: -0.72 };
const LIGHT3 = { x: -0.48, y: 0.64, z: 0.6 };

const darkCache = new WeakMap<CanvasImageSource, HTMLCanvasElement>();
let glaze: HTMLCanvasElement | null = null;
let glazeCtx: CanvasRenderingContext2D | null = null;
let sampleCv: HTMLCanvasElement | null = null;
let sampleCtx: CanvasRenderingContext2D | null = null;
const volCache = new WeakMap<object, Map<string, VolMesh>>();

type VolMesh = {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  r: Uint8Array;
  g: Uint8Array;
  b: Uint8Array;
  nx: Int8Array;
  ny: Int8Array;
  nz: Int8Array;
  count: number;
  grid: number;
  bake: HTMLCanvasElement;
  bakeW: number;
  bakeH: number;
  feetX: number;
  feetY: number;
  bodyW: number;
  bodyH: number;
};

function darkened(img: CanvasImageSource): HTMLCanvasElement {
  const hit = darkCache.get(img);
  if (hit) return hit;
  const w = "width" in img ? Number(img.width) : 1;
  const h = "height" in img ? Number(img.height) : 1;
  const c = document.createElement("canvas");
  c.width = Math.max(1, w);
  c.height = Math.max(1, h);
  const x = c.getContext("2d");
  if (x) {
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = "source-atop";
    x.fillStyle = "rgba(22, 12, 18, 0.84)";
    x.fillRect(0, 0, c.width, c.height);
  }
  darkCache.set(img, c);
  return c;
}

function glazeBuf(w: number, h: number): CanvasRenderingContext2D {
  if (!glaze) {
    glaze = document.createElement("canvas");
    glazeCtx = glaze.getContext("2d");
  }
  const needW = Math.max(32, Math.ceil(w));
  const needH = Math.max(32, Math.ceil(h));
  if (glaze.width < needW) glaze.width = needW;
  if (glaze.height < needH) glaze.height = needH;
  return glazeCtx as CanvasRenderingContext2D;
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  flip: boolean,
  ox = 0,
  oy = 0,
) {
  ctx.save();
  ctx.translate(x + ox, y + oy);
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

function contactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  const ry = Math.max(4, rx * 0.32);
  const ox = -LIGHT.x * rx * 0.35;
  const oy = -LIGHT.y * ry * 0.2;
  ctx.save();
  const g = ctx.createRadialGradient(x + ox, y + oy, 1, x + ox, y + oy, rx);
  g.addColorStop(0, "rgba(8, 6, 10, 0.55)");
  g.addColorStop(0.5, "rgba(8, 6, 10, 0.22)");
  g.addColorStop(1, "rgba(8, 6, 10, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x + ox, y + 2 + oy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStackBody(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  flip: boolean,
  layers: number,
) {
  const dark = darkened(img);
  const sign = flip ? -1 : 1;
  for (let i = layers; i >= 1; i--) {
    const ox = i * 0.55 * sign - LIGHT.x * i * 0.15;
    const oy = -i * 1.05;
    blit(ctx, dark, sx, sy, sw, sh, x, y, dw, dh, flip, ox, oy);
  }
}

function drawSliceBody(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  flip: boolean,
  slices: number,
) {
  const pitch = 1.05;
  const sliceSrc = sh / slices;
  const sliceDst = dh / slices;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  for (let i = 0; i < slices; i++) {
    const srcY = sy + i * sliceSrc;
    const t = 1 - i / slices;
    const destY = -dh + i * sliceDst;
    const lift = t * slices * pitch * 0.22;
    const sxOff = t * slices * 0.4;
    ctx.drawImage(img, sx, srcY, sw, sliceSrc + 0.6, -dw / 2 + sxOff, destY - lift, dw, sliceDst + 1.35);
  }
  ctx.restore();
}

function drawLitFace(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  flip: boolean,
) {
  const gctx = glazeBuf(dw, dh);
  const gw = Math.ceil(dw);
  const gh = Math.ceil(dh);
  gctx.clearRect(0, 0, gw, gh);
  gctx.globalCompositeOperation = "source-over";
  gctx.drawImage(img, sx, sy, sw, sh, 0, 0, gw, gh);
  gctx.globalCompositeOperation = "source-atop";
  const gx0 = flip ? gw * 0.78 : gw * 0.18;
  const gy0 = gh * 0.12;
  const gx1 = flip ? gw * 0.2 : gw * 0.82;
  const gy1 = gh * 0.92;
  const grad = gctx.createLinearGradient(gx0, gy0, gx1, gy1);
  grad.addColorStop(0, "rgba(255, 236, 214, 0.38)");
  grad.addColorStop(0.42, "rgba(255, 255, 255, 0)");
  grad.addColorStop(1, "rgba(18, 8, 22, 0.42)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, gw, gh);
  const spec = gctx.createRadialGradient(gx0, gy0, 2, gx0, gy0, Math.max(gw, gh) * 0.45);
  spec.addColorStop(0, "rgba(255, 248, 236, 0.28)");
  spec.addColorStop(1, "rgba(255, 248, 236, 0)");
  gctx.fillStyle = spec;
  gctx.fillRect(0, 0, gw, gh);
  gctx.globalCompositeOperation = "source-over";
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(glaze as HTMLCanvasElement, 0, 0, gw, gh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

function sampleFrame(
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  grid: number,
): ImageData {
  if (!sampleCv) {
    sampleCv = document.createElement("canvas");
    sampleCtx = sampleCv.getContext("2d", { willReadFrequently: true });
  }
  if (sampleCv.width !== grid || sampleCv.height !== grid) {
    sampleCv.width = grid;
    sampleCv.height = grid;
  }
  const x = sampleCtx as CanvasRenderingContext2D;
  x.clearRect(0, 0, grid, grid);
  x.imageSmoothingEnabled = false;
  x.drawImage(img, sx, sy, sw, sh, 0, 0, grid, grid);
  return x.getImageData(0, 0, grid, grid);
}

const INF2 = 1e12;

function edt1d(f: Float64Array, n: number, v: Int32Array, z: Float64Array, d: Float64Array) {
  v[0] = 0;
  z[0] = -INF2;
  z[1] = INF2;
  let k = 0;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * (q - v[k]));
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF2;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const p = v[k];
    d[q] = (q - p) * (q - p) + f[p];
  }
}

function euclidDt(seed: Uint8Array, w: number, h: number): Float32Array {
  const tmp = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) tmp[i] = seed[i] ? 0 : INF2;
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = tmp[y * w + x];
    edt1d(f, w, v, z, d);
    for (let x = 0; x < w; x++) tmp[y * w + x] = d[x];
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = tmp[y * w + x];
    edt1d(f, h, v, z, d);
    for (let y = 0; y < h; y++) tmp[y * w + x] = d[y];
  }
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = Math.sqrt(tmp[i]);
  return out;
}

/** Signed Euclidean SDF: negative inside the silhouette, pixel units. */
function signedSdf(alpha: Uint8Array, w: number, h: number, thresh: number): Float32Array {
  const inside = new Uint8Array(w * h);
  const outside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const on = alpha[i] >= thresh ? 1 : 0;
    inside[i] = on;
    outside[i] = on ? 0 : 1;
  }
  const dtIn = euclidDt(inside, w, h);
  const dtOut = euclidDt(outside, w, h);
  const sdf = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) sdf[i] = dtIn[i] - dtOut[i];
  return sdf;
}

function sampleSdf2(sdf: Float32Array, g: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(g - 2, Math.floor(x)));
  const y0 = Math.max(0, Math.min(g - 2, Math.floor(y)));
  const tx = Math.max(0, Math.min(1, x - x0));
  const ty = Math.max(0, Math.min(1, y - y0));
  const i00 = y0 * g + x0;
  const i10 = i00 + 1;
  const i01 = i00 + g;
  const i11 = i01 + 1;
  const a = sdf[i00] * (1 - tx) + sdf[i10] * tx;
  const b = sdf[i01] * (1 - tx) + sdf[i11] * tx;
  return a * (1 - ty) + b * ty;
}

function sampleColor(data: Uint8ClampedArray, g: number, x: number, y: number) {
  const px = Math.max(0, Math.min(g - 1, Math.round(x)));
  const py = Math.max(0, Math.min(g - 1, Math.round(y)));
  const i = (py * g + px) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function opExtrude(d2: number, z: number, h: number): number {
  const wy = Math.abs(z) - h;
  const mx = Math.max(d2, 0);
  const my = Math.max(wy, 0);
  return Math.min(Math.max(d2, wy), 0) + Math.hypot(mx, my);
}

function evalSdf3(d2: number, z: number, mode: SdfTech): number {
  const h = mode === "prism" ? 3.1 : 2.55;
  const r = mode === "prism" ? 0 : 1.55;
  const d = opExtrude(d2, z, h) - r;
  if (mode === "shell") return Math.abs(d) - 0.85;
  return d;
}

function sdf3At(sdf: Float32Array, g: number, x: number, y: number, z: number, mode: SdfTech): number {
  return evalSdf3(sampleSdf2(sdf, g, x, y), z, mode);
}

function grad3(
  sdf: Float32Array,
  g: number,
  x: number,
  y: number,
  z: number,
  mode: SdfTech,
): { nx: number; ny: number; nz: number } {
  const e = 0.7;
  const nx = sdf3At(sdf, g, x + e, y, z, mode) - sdf3At(sdf, g, x - e, y, z, mode);
  const nyImg = sdf3At(sdf, g, x, y + e, z, mode) - sdf3At(sdf, g, x, y - e, z, mode);
  const nz = sdf3At(sdf, g, x, y, z + e, mode) - sdf3At(sdf, g, x, y, z - e, mode);
  const ny = -nyImg;
  const mag = Math.hypot(nx, ny, nz) || 1;
  return { nx: nx / mag, ny: ny / mag, nz: nz / mag };
}

function emptyMesh(grid: number): VolMesh {
  return {
    x: new Float32Array(0),
    y: new Float32Array(0),
    z: new Float32Array(0),
    r: new Uint8Array(0),
    g: new Uint8Array(0),
    b: new Uint8Array(0),
    nx: new Int8Array(0),
    ny: new Int8Array(0),
    nz: new Int8Array(0),
    count: 0,
    grid,
    bake: document.createElement("canvas"),
    bakeW: 0,
    bakeH: 0,
    feetX: 0,
    feetY: 0,
    bodyW: 96,
    bodyH: 128,
  };
}

function voxelizeSdf(
  sdf: Float32Array,
  data: Uint8ClampedArray,
  grid: number,
  mode: SdfTech,
  zStep: number,
): VolMesh {
  const half = mode === "prism" ? 3.4 : 4.2;
  const cap = Math.min(4200, grid * grid * 8);
  const xs = new Float32Array(cap);
  const ys = new Float32Array(cap);
  const zs = new Float32Array(cap);
  const rs = new Uint8Array(cap);
  const gs = new Uint8Array(cap);
  const bs = new Uint8Array(cap);
  const nxs = new Int8Array(cap);
  const nys = new Int8Array(cap);
  const nzs = new Int8Array(cap);
  let count = 0;
  const inv = 1 / Math.max(1, grid - 1);

  for (let py = 0; py < grid; py++) {
    for (let px = 0; px < grid; px++) {
      const i = py * grid + px;
      const d2 = sdf[i];
      if (d2 > 2.4) continue;
      const col = i * 4;
      if (data[col + 3] < 18 && d2 > 0.4) continue;
      for (let z = -half; z <= half && count < cap; z += zStep) {
        const d = evalSdf3(d2, z, mode);
        if (d > 0.55) continue;
        const n = grad3(sdf, grid, px + 0.5, py + 0.5, z, mode);
        xs[count] = px * inv - 0.5;
        ys[count] = 1 - py * inv;
        zs[count] = z / grid;
        rs[count] = data[col];
        gs[count] = data[col + 1];
        bs[count] = data[col + 2];
        nxs[count] = n.nx * 127;
        nys[count] = n.ny * 127;
        nzs[count] = n.nz * 127;
        count++;
      }
    }
  }

  const order = Array.from({ length: count }, (_, i) => i);
  order.sort((a, b) => zs[a] - zs[b] || ys[a] - ys[b]);
  const mesh = emptyMesh(grid);
  mesh.x = new Float32Array(count);
  mesh.y = new Float32Array(count);
  mesh.z = new Float32Array(count);
  mesh.r = new Uint8Array(count);
  mesh.g = new Uint8Array(count);
  mesh.b = new Uint8Array(count);
  mesh.nx = new Int8Array(count);
  mesh.ny = new Int8Array(count);
  mesh.nz = new Int8Array(count);
  mesh.count = count;
  for (let i = 0; i < count; i++) {
    const s = order[i];
    mesh.x[i] = xs[s];
    mesh.y[i] = ys[s];
    mesh.z[i] = zs[s];
    mesh.r[i] = rs[s];
    mesh.g[i] = gs[s];
    mesh.b[i] = bs[s];
    mesh.nx[i] = nxs[s];
    mesh.ny[i] = nys[s];
    mesh.nz[i] = nzs[s];
  }
  return mesh;
}

function rgb(r: number, g: number, b: number, k: number) {
  const rr = Math.max(0, Math.min(255, r * k)) | 0;
  const gg = Math.max(0, Math.min(255, g * k)) | 0;
  const bb = Math.max(0, Math.min(255, b * k)) | 0;
  return `rgb(${rr},${gg},${bb})`;
}

function paintCubes(
  ctx: CanvasRenderingContext2D,
  mesh: VolMesh,
  x: number,
  y: number,
  dw: number,
  dh: number,
) {
  const s = Math.max(1.5, dw / mesh.grid);
  const hz = Math.max(0.7, s * 0.24);
  const hx = Math.max(0.6, s * 0.18);
  const yaw = 0.2;
  const pitch = 0.1;
  const lx = LIGHT3.x;
  const ly = LIGHT3.y;
  const lz = LIGHT3.z;
  for (let i = 0; i < mesh.count; i++) {
    const vx = mesh.x[i] * dw;
    const vy = mesh.y[i] * dh;
    const vz = mesh.z[i];
    const px = x + vx + vz * dw * yaw;
    const py = y - vy + vz * dh * pitch;
    const nx = mesh.nx[i] / 127;
    const ny = mesh.ny[i] / 127;
    const nz = mesh.nz[i] / 127;
    const ndotl = Math.max(0, nx * lx + ny * ly + nz * lz);
    const k = 0.2 + 0.8 * ndotl;
    const r = mesh.r[i];
    const g = mesh.g[i];
    const b = mesh.b[i];
    ctx.fillStyle = rgb(r, g, b, k);
    ctx.fillRect(px - s / 2, py - s + hz * 0.1, s, s);
    if (nx > 0.22) {
      ctx.fillStyle = rgb(r, g, b, k * 0.55);
      ctx.fillRect(px + s / 2 - 0.4, py - s + hz * 0.16, hx, s - hz * 0.1);
    }
    if (ny > 0.18) {
      ctx.fillStyle = rgb(r, g, b, k * 1.16);
      ctx.fillRect(px - s / 2 + hx * 0.1, py - s - hz * 0.08, s, hz);
    }
  }
}

function bakeCubes(mesh: VolMesh) {
  const bodyW = 96;
  const bodyH = 128;
  const pad = 18;
  const w = bodyW + pad * 2;
  const h = bodyH + pad * 2;
  mesh.bake.width = w;
  mesh.bake.height = h;
  const x = mesh.bake.getContext("2d");
  if (!x) return;
  paintCubes(x, mesh, pad + bodyW / 2, pad + bodyH, bodyW, bodyH);
  mesh.bakeW = w;
  mesh.bakeH = h;
  mesh.feetX = pad + bodyW / 2;
  mesh.feetY = pad + bodyH;
  mesh.bodyW = bodyW;
  mesh.bodyH = bodyH;
}

function bakeMarch(sdf: Float32Array, data: Uint8ClampedArray, grid: number, reduced: boolean): VolMesh {
  const mesh = emptyMesh(grid);
  const bodyW = reduced ? 80 : 110;
  const bodyH = reduced ? 108 : 148;
  const pad = 16;
  const w = bodyW + pad * 2;
  const h = bodyH + pad * 2;
  mesh.bake.width = w;
  mesh.bake.height = h;
  const ctx = mesh.bake.getContext("2d");
  if (!ctx) return mesh;
  const img = ctx.createImageData(w, h);
  const out = img.data;
  const steps = reduced ? 14 : 22;
  const lx = LIGHT3.x;
  const ly = LIGHT3.y;
  const lz = LIGHT3.z;
  const dirX = 0.22;
  const dirY = 0.16;
  const dirZ = -1;
  const dlen = Math.hypot(dirX, dirY, dirZ);
  const rdx = dirX / dlen;
  const rdy = dirY / dlen;
  const rdz = dirZ / dlen;

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const vx = (px - pad) / bodyW - 0.5;
      const vy = 1 - (py - pad) / bodyH;
      let x = (vx + 0.5) * (grid - 1);
      let y = (1 - vy) * (grid - 1);
      let z = 7.2;
      let hit = false;
      let hx = x;
      let hy = y;
      let hz = z;
      for (let s = 0; s < steps; s++) {
        const d = sdf3At(sdf, grid, x, y, z, "round");
        if (d < 0.12) {
          hit = true;
          hx = x;
          hy = y;
          hz = z;
          break;
        }
        const adv = Math.max(d, 0.35);
        x += rdx * adv;
        y += rdy * adv;
        z += rdz * adv;
        if (z < -6) break;
      }
      if (!hit) continue;
      const n = grad3(sdf, grid, hx, hy, hz, "round");
      const col = sampleColor(data, grid, hx, hy);
      if (col.a < 12) continue;
      const ndotl = Math.max(0, n.nx * lx + n.ny * ly + n.nz * lz);
      const hxv = Math.max(0, n.nx * 0.15 + n.ny * 0.55 + n.nz * 0.82);
      const spec = hxv * hxv * hxv * hxv * 48;
      const k = 0.18 + 0.72 * ndotl;
      const o = (py * w + px) * 4;
      out[o] = Math.max(0, Math.min(255, col.r * k + spec));
      out[o + 1] = Math.max(0, Math.min(255, col.g * k + spec * 0.92));
      out[o + 2] = Math.max(0, Math.min(255, col.b * k + spec * 0.8));
      out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  mesh.count = 1;
  mesh.bakeW = w;
  mesh.bakeH = h;
  mesh.feetX = pad + bodyW / 2;
  mesh.feetY = pad + bodyH;
  mesh.bodyW = bodyW;
  mesh.bodyH = bodyH;
  return mesh;
}

function getMesh(
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  grid: number,
  mode: SdfTech,
  reduced: boolean,
): VolMesh {
  let map = volCache.get(img as object);
  if (!map) {
    map = new Map();
    volCache.set(img as object, map);
  }
  const key = `${sx | 0}|${sy | 0}|${grid}|${mode}|${reduced ? 1 : 0}`;
  let mesh = map.get(key);
  if (!mesh) {
    const pix = sampleFrame(img, sx, sy, sw, sh, grid);
    const n = grid * grid;
    const alpha = new Uint8Array(n);
    for (let i = 0; i < n; i++) alpha[i] = pix.data[i * 4 + 3];
    const sdf = signedSdf(alpha, grid, grid, 96);
    if (mode === "march") {
      mesh = bakeMarch(sdf, pix.data, grid, reduced);
    } else {
      mesh = voxelizeSdf(sdf, pix.data, grid, mode, reduced ? 1.25 : 0.9);
      if (mesh.count >= 8) bakeCubes(mesh);
    }
    map.set(key, mesh);
  }
  return mesh;
}

function drawSdf(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  flip: boolean,
  reduced: boolean,
  mode: SdfTech,
) {
  const grid = reduced ? 28 : mode === "march" ? 40 : 46;
  const mesh = getMesh(img, sx, sy, sw, sh, grid, mode, reduced);
  if (mesh.count < 8 && mode !== "march") {
    drawLitFace(ctx, img, sx, sy, sw, sh, x, y, dw, dh, flip);
    return;
  }
  if (mesh.bakeW === 0) bakeCubes(mesh);
  const sxScale = dw / mesh.bodyW;
  const syScale = dh / mesh.bodyH;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(
    mesh.bake,
    -mesh.feetX * sxScale,
    -mesh.feetY * syScale,
    mesh.bakeW * sxScale,
    mesh.bakeH * syScale,
  );
  ctx.restore();
}

export type SpriteDraw = {
  img: CanvasImageSource;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  x: number;
  y: number;
  w: number;
  h: number;
  flip?: boolean;
  tech: SpriteTech;
  recoil?: number;
  shadow?: number;
  reduced?: boolean;
};

export function drawSprite3D(ctx: CanvasRenderingContext2D, d: SpriteDraw) {
  const squash = 1 - (d.recoil ?? 0) * 0.08;
  const dw = d.w;
  const dh = d.h * squash;
  const flip = !!d.flip;
  let tech = normalizeTech(d.tech);
  if (d.reduced && (tech === "slice" || tech === "stack")) tech = "lit";
  if (d.shadow) contactShadow(ctx, d.x, d.y, d.shadow);

  if (tech === "flat") {
    blit(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip);
    return;
  }

  if (tech === "stack") {
    drawStackBody(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip, d.reduced ? 4 : 8);
    blit(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip);
    return;
  }

  if (tech === "slice") {
    drawSliceBody(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip, d.reduced ? 8 : 18);
    return;
  }

  if (tech === "lit") {
    drawLitFace(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip);
    return;
  }

  if (tech === "mini") {
    drawStackBody(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip, d.reduced ? 4 : 9);
    drawLitFace(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip);
    return;
  }

  drawSdf(ctx, d.img, d.sx, d.sy, d.sw, d.sh, d.x, d.y, dw, dh, flip, !!d.reduced, tech as SdfTech);
}

export function spriteSource(img: HTMLImageElement | HTMLCanvasElement, frame: number, cols: number, rows: number) {
  const fw = img.width / cols;
  const fh = img.height / rows;
  const i = ((frame % (cols * rows)) + cols * rows) % (cols * rows);
  return { sx: (i % cols) * fw, sy: Math.floor(i / cols) * fh, sw: fw, sh: fh };
}

export function sdfBlurb(tech: SpriteTech | undefined): string {
  const t = normalizeTech(tech);
  if (t === "stack") return "Cardboard extrusion — classic 3D sprite thickness.";
  if (t === "slice") return "Scanline stack — each band lifts toward the lamp.";
  if (t === "lit") return "Billboard with a directional glaze and rim.";
  if (t === "flat") return "Raw blit. No volume.";
  if (t === "mini") return "Miniature: stack, glaze, and a ground contact.";
  if (t === "prism") return "Hard SDF extrusion — Euclidean distance, sharp rims.";
  if (t === "shell") return "Iso-surface voxels — onion skin of the rounded SDF.";
  if (t === "march") return "Sphere-traced SDF — baked raymarch, smooth volume.";
  return "Rounded 3D SDF — prism minus radius, gradient normals.";
}
