import type { EnemyDef, EnemyKind, RankStats, TowerDef, TowerKind, Vec, WaveDef } from "./types";

export const WORLD_W = 1280;
export const WORLD_H = 720;
export const COLS = 20;
export const ROWS = 12;
export const CELL_W = WORLD_W / COLS;
export const CELL_H = WORLD_H / ROWS;
export const START_GOLD = 240;
export const START_LIVES = 12;
export const PREP_TIME = 24;
export const SELL_RATE = 0.65;
export const MAX_LEVEL = 3;
export const SAVE_KEY = "sakura-sentinel-v1";

/** Path through the shrine garden, in world pixels. Centerline of the painted sandō. */
export const WAYPOINTS: Vec[] = [
  { x: 0, y: 430 },
  { x: 80, y: 436 },
  { x: 160, y: 452 },
  { x: 240, y: 492 },
  { x: 320, y: 528 },
  { x: 400, y: 556 },
  { x: 480, y: 562 },
  { x: 560, y: 540 },
  { x: 640, y: 524 },
  { x: 720, y: 490 },
  { x: 800, y: 438 },
  { x: 880, y: 362 },
  { x: 960, y: 339 },
  { x: 1040, y: 270 },
  { x: 1120, y: 262 },
  { x: 1200, y: 244 },
  { x: 1280, y: 234 },
];

export const PATH_HALF = 28;

export const TOWERS: Record<TowerKind, TowerDef> = {
  yumi: {
    id: "yumi",
    name: "Yumi Nest",
    title: "Shrine archer",
    blurb: "Arrows. Consecrate for pierce and crits.",
    cost: 70,
    damage: 16,
    range: 168,
    fireRate: 1.15,
    projectileSpeed: 520,
    splash: 0,
    slow: 0,
    slowTime: 0,
    chain: 0,
    damageType: "physical",
    color: "#e85a8a",
  },
  ofuda: {
    id: "ofuda",
    name: "Ofuda Altar",
    title: "Talisman mage",
    blurb: "Splash seals. Rank III plants wards.",
    cost: 110,
    damage: 12,
    range: 150,
    fireRate: 0.9,
    projectileSpeed: 380,
    splash: 72,
    slow: 0,
    slowTime: 0,
    chain: 0,
    damageType: "magic",
    color: "#e8c9a0",
  },
  kitsune: {
    id: "kitsune",
    name: "Kitsune Beacon",
    title: "Foxfire slow",
    blurb: "Foxfire slow. Rank III is an aura.",
    cost: 130,
    damage: 5,
    range: 142,
    fireRate: 1.45,
    projectileSpeed: 340,
    splash: 0,
    slow: 0.45,
    slowTime: 1.8,
    chain: 0,
    damageType: "magic",
    color: "#4a8b74",
  },
  taiko: {
    id: "taiko",
    name: "Raijin Taiko",
    title: "Storm drum",
    blurb: "Chain lightning. Rank III stuns.",
    cost: 190,
    damage: 34,
    range: 186,
    fireRate: 0.72,
    projectileSpeed: 0,
    splash: 0,
    slow: 0,
    slowTime: 0,
    chain: 3,
    damageType: "magic",
    color: "#d45b5b",
  },
};

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  imp: { id: "imp", name: "Oni Imp", hp: 38, speed: 58, gold: 7, armor: 0, resist: 0, radius: 14, scale: 0.72 },
  tengu: { id: "tengu", name: "Karasu Tengu", hp: 26, speed: 102, gold: 9, armor: 0, resist: 0, radius: 15, scale: 0.78 },
  oni: { id: "oni", name: "Oni Brute", hp: 150, speed: 38, gold: 16, armor: 0.42, resist: 0.08, radius: 20, scale: 1.05 },
  yurei: { id: "yurei", name: "Yurei", hp: 58, speed: 74, gold: 12, armor: 0, resist: 0.38, radius: 16, scale: 0.9 },
  boss: { id: "boss", name: "Oni Daimyo", hp: 1320, speed: 30, gold: 90, armor: 0.22, resist: 0.18, radius: 28, scale: 1.45 },
};

export const WAVES: WaveDef[] = [
  { id: 1, name: "First Footfalls", spawns: [{ kind: "imp", count: 8, interval: 0.85, delay: 0 }] },
  { id: 2, name: "Imp Tide", spawns: [{ kind: "imp", count: 14, interval: 0.62, delay: 0 }] },
  {
    id: 3,
    name: "Crow Scouts",
    spawns: [
      { kind: "imp", count: 8, interval: 0.7, delay: 0 },
      { kind: "tengu", count: 5, interval: 0.9, delay: 2.4 },
    ],
  },
  { id: 4, name: "Tengu Rush", spawns: [{ kind: "tengu", count: 12, interval: 0.5, delay: 0 }] },
  {
    id: 5,
    name: "Iron Horns",
    spawns: [
      { kind: "oni", count: 5, interval: 1.4, delay: 0 },
      { kind: "imp", count: 10, interval: 0.55, delay: 1 },
    ],
  },
  {
    id: 6,
    name: "Mixed Host",
    spawns: [
      { kind: "tengu", count: 8, interval: 0.55, delay: 0 },
      { kind: "oni", count: 5, interval: 1.2, delay: 2 },
    ],
  },
  { id: 7, name: "Pale Procession", spawns: [{ kind: "yurei", count: 12, interval: 0.65, delay: 0 }] },
  {
    id: 8,
    name: "Grave and Steel",
    spawns: [
      { kind: "oni", count: 6, interval: 1.1, delay: 0 },
      { kind: "yurei", count: 8, interval: 0.7, delay: 1.5 },
    ],
  },
  {
    id: 9,
    name: "The Gathering",
    spawns: [
      { kind: "imp", count: 8, interval: 0.45, delay: 0 },
      { kind: "tengu", count: 8, interval: 0.5, delay: 1 },
      { kind: "oni", count: 5, interval: 1.0, delay: 3 },
      { kind: "yurei", count: 6, interval: 0.7, delay: 4 },
    ],
  },
  {
    id: 10,
    name: "Daimyo's March",
    spawns: [
      { kind: "oni", count: 6, interval: 1.1, delay: 0 },
      { kind: "yurei", count: 8, interval: 0.65, delay: 2 },
      { kind: "boss", count: 1, interval: 1, delay: 8 },
    ],
  },
];

export const TOWER_ORDER: TowerKind[] = ["yumi", "ofuda", "kitsune", "taiko"];

export const WAVE_HINTS: string[] = [
  "Imps. Place Yumi on a pale pad.",
  "More imps. Consecrate if you can.",
  "Tengu run. Pierce or splash holds them.",
  "Tengu rush. Slow the file or they leak.",
  "Oni armor. Magic hurts; arrows tick.",
  "Mixed host. Keep physical and magic.",
  "Yurei resist magic. Keep a Yumi.",
  "Oni and ghosts. Split your rites.",
  "Everything at once. Cover both damage types.",
  "Daimyo. Mixed armor. Slow and stun him — he rages at half.",
];

export function earlyCallGold(prep: number) {
  return prep > 2 ? Math.floor(prep * 1.5) : 0;
}

export function waveHint(wave: number, waveActive: boolean) {
  const i = waveActive ? wave - 1 : wave;
  return WAVE_HINTS[Math.max(0, Math.min(WAVE_HINTS.length - 1, i))] ?? "";
}

export const PROP_PLACEMENTS: {
  id: "tree" | "torii" | "lantern" | "shrine";
  x: number;
  y: number;
  scale: number;
}[] = [
  { id: "shrine", x: 148, y: 168, scale: 0.72 },
  { id: "tree", x: 250, y: 132, scale: 0.95 },
  { id: "tree", x: 742, y: 118, scale: 1.05 },
  { id: "tree", x: 1088, y: 168, scale: 0.88 },
  { id: "lantern", x: 360, y: 248, scale: 0.55 },
  { id: "lantern", x: 640, y: 210, scale: 0.52 },
  { id: "lantern", x: 980, y: 268, scale: 0.55 },
  { id: "lantern", x: 210, y: 430, scale: 0.5 },
  { id: "torii", x: 1210, y: 372, scale: 0.82 },
];

export function cellCenter(col: number, row: number): Vec {
  return { x: (col + 0.5) * CELL_W, y: (row + 0.5) * CELL_H };
}

export function distToPath(x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    const d = Math.hypot(x - px, y - py);
    if (d < best) best = d;
  }
  return best;
}

export function isWater(col: number, row: number): boolean {
  return row >= 10;
}

/** Hand-placed stone foundations along the sandō. Always visible, easy to click. */
export const PLOTS: { col: number; row: number }[] = [
  { col: 1, row: 6 },
  { col: 0, row: 8 },
  { col: 4, row: 7 },
  { col: 3, row: 9 },
  { col: 7, row: 8 },
  { col: 9, row: 7 },
  { col: 11, row: 6 },
  { col: 11, row: 9 },
  { col: 12, row: 5 },
  { col: 14, row: 4 },
  { col: 16, row: 3 },
  { col: 18, row: 5 },
  { col: 19, row: 2 },
];

const PLOT_KEY = new Set(PLOTS.map((p) => `${p.col},${p.row}`));

export function isPlot(col: number, row: number) {
  return PLOT_KEY.has(`${col},${row}`);
}

export function isOnPath(col: number, row: number) {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return true;
  const { x, y } = cellCenter(col, row);
  return distToPath(x, y) < PATH_HALF + 12;
}

export function isBlockedTerrain(col: number, row: number) {
  if (isWater(col, row)) return true;
  if (col <= 3 && row <= 3) return true;
  return false;
}

export function isBuildableCell(col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return false;
  if (isBlockedTerrain(col, row)) return false;
  if (isOnPath(col, row)) return false;
  return true;
}

export function nearestPlot(x: number, y: number, maxDist = 36) {
  let best: { col: number; row: number } | null = null;
  let bestD = maxDist;
  for (const p of PLOTS) {
    const c = cellCenter(p.col, p.row);
    const d = Math.hypot(x - c.x, y - c.y);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

export function pathLength(): number {
  let len = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    len += Math.hypot(WAYPOINTS[i + 1].x - WAYPOINTS[i].x, WAYPOINTS[i + 1].y - WAYPOINTS[i].y);
  }
  return len;
}

export const PATH_LEN = pathLength();

export function pointOnPath(progress: number): { x: number; y: number; nx: number; ny: number; tx: number; ty: number } {
  const dist = Math.max(0, Math.min(1, progress)) * PATH_LEN;
  let acc = 0;
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    if (acc + len >= dist || i === WAYPOINTS.length - 2) {
      const u = (dist - acc) / len;
      const tx = (b.x - a.x) / len;
      const ty = (b.y - a.y) / len;
      return {
        x: a.x + tx * (dist - acc),
        y: a.y + ty * (dist - acc),
        nx: -ty,
        ny: tx,
        tx,
        ty,
      };
    }
    acc += len;
  }
  const last = WAYPOINTS[WAYPOINTS.length - 1];
  return { x: last.x, y: last.y, nx: 0, ny: -1, tx: 1, ty: 0 };
}

export const RANKS: Record<TowerKind, RankStats[]> = {
  yumi: [
    {
      name: "Yumi Nest",
      cost: 0,
      blurb: "Fast single-target arrows.",
      damage: 16,
      range: 168,
      fireRate: 1.15,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Blessed String",
      cost: 80,
      blurb: "Arrows pierce one yokai.",
      damage: 22,
      range: 186,
      fireRate: 1.35,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 0,
      pierce: 1,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Moonbow",
      cost: 150,
      blurb: "Pierce two. 25% moon crits.",
      damage: 30,
      range: 210,
      fireRate: 1.5,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 0,
      pierce: 2,
      crit: 0.25,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
  ],
  ofuda: [
    {
      name: "Ofuda Altar",
      cost: 0,
      blurb: "Splash talismans.",
      damage: 12,
      range: 150,
      fireRate: 0.9,
      splash: 72,
      slow: 0,
      slowTime: 0,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Seal Storm",
      cost: 95,
      blurb: "Wider burst. Stronger seals.",
      damage: 18,
      range: 162,
      fireRate: 1.0,
      splash: 96,
      slow: 0,
      slowTime: 0,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Ward Array",
      cost: 170,
      blurb: "Impacts leave a burning ward.",
      damage: 24,
      range: 176,
      fireRate: 1.08,
      splash: 118,
      slow: 0.15,
      slowTime: 1.2,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: true,
    },
  ],
  kitsune: [
    {
      name: "Kitsune Beacon",
      cost: 0,
      blurb: "Foxfire slow on hit.",
      damage: 5,
      range: 142,
      fireRate: 1.45,
      splash: 0,
      slow: 0.45,
      slowTime: 1.8,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Twin Tails",
      cost: 100,
      blurb: "Heavier slow. Hits splash chill.",
      damage: 8,
      range: 156,
      fireRate: 1.6,
      splash: 48,
      slow: 0.55,
      slowTime: 2.2,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Foxfire Circle",
      cost: 180,
      blurb: "Always-on slow aura in range.",
      damage: 11,
      range: 170,
      fireRate: 1.75,
      splash: 56,
      slow: 0.62,
      slowTime: 2.4,
      chain: 0,
      pierce: 0,
      crit: 0,
      aura: 0.35,
      stun: 0,
      aftershock: false,
    },
  ],
  taiko: [
    {
      name: "Raijin Taiko",
      cost: 0,
      blurb: "Chain lightning. Three leaps.",
      damage: 34,
      range: 186,
      fireRate: 0.72,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 3,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Thunder Roll",
      cost: 140,
      blurb: "Four leaps. Harder strikes.",
      damage: 46,
      range: 204,
      fireRate: 0.82,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 4,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0,
      aftershock: false,
    },
    {
      name: "Raijin's Fury",
      cost: 220,
      blurb: "Five leaps. Primary target stuns.",
      damage: 60,
      range: 220,
      fireRate: 0.92,
      splash: 0,
      slow: 0,
      slowTime: 0,
      chain: 5,
      pierce: 0,
      crit: 0,
      aura: 0,
      stun: 0.55,
      aftershock: false,
    },
  ],
};

export function rankOf(kind: TowerKind, level: number): RankStats {
  const list = RANKS[kind];
  const i = Math.max(0, Math.min(list.length - 1, level - 1));
  return list[i];
}

export function nextRank(kind: TowerKind, level: number): RankStats | null {
  return RANKS[kind][level] ?? null;
}

export function towerStats(kind: TowerKind, level: number): RankStats {
  return rankOf(kind, level);
}

export const ROMAN = ["I", "II", "III"] as const;

export function rankTags(r: RankStats): string[] {
  const tags: string[] = [];
  if (r.pierce > 0) tags.push(`Pierce ${r.pierce}`);
  if (r.crit > 0) tags.push(`${Math.round(r.crit * 100)}% crit`);
  if (r.splash > 0) tags.push(`Splash ${Math.round(r.splash)}`);
  if (r.slow > 0 && r.aura <= 0) tags.push(`${Math.round(r.slow * 100)}% slow`);
  if (r.chain > 0) tags.push(`Chain ${r.chain}`);
  if (r.aura > 0) tags.push(`${Math.round(r.aura * 100)}% aura`);
  if (r.stun > 0) tags.push(`Stun ${r.stun.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}s`);
  if (r.aftershock) tags.push("Wards");
  return tags;
}

