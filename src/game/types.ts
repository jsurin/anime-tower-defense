import type { SpriteTech } from "./sprite3d";

export type TowerKind = "yumi" | "ofuda" | "kitsune" | "taiko";
export type EnemyKind = "imp" | "tengu" | "oni" | "yurei" | "boss";
export type Targeting = "first" | "last" | "strong" | "close";
export type DamageType = "physical" | "magic";
export type Phase = "boot" | "title" | "playing" | "paused" | "won" | "lost";

export type Vec = { x: number; y: number };

export type TowerDef = {
  id: TowerKind;
  name: string;
  title: string;
  blurb: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  projectileSpeed: number;
  splash: number;
  slow: number;
  slowTime: number;
  chain: number;
  damageType: DamageType;
  color: string;
};

export type RankStats = {
  name: string;
  cost: number;
  blurb: string;
  damage: number;
  range: number;
  fireRate: number;
  splash: number;
  slow: number;
  slowTime: number;
  chain: number;
  pierce: number;
  crit: number;
  aura: number;
  stun: number;
  aftershock: boolean;
};

export type EnemyDef = {
  id: EnemyKind;
  name: string;
  hp: number;
  speed: number;
  gold: number;
  armor: number;
  resist: number;
  radius: number;
  scale: number;
};

export type WaveSpawn = {
  kind: EnemyKind;
  count: number;
  interval: number;
  delay: number;
};

export type WaveDef = {
  id: number;
  name: string;
  spawns: WaveSpawn[];
};

export type Tower = {
  id: number;
  kind: TowerKind;
  col: number;
  row: number;
  x: number;
  y: number;
  level: number;
  cooldown: number;
  spent: number;
  recoil: number;
  targetId: number;
  flash: number;
  targeting: Targeting;
};

export type Enemy = {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  wp: number;
  progress: number;
  lane: number;
  slow: number;
  slowT: number;
  stunT: number;
  flash: number;
  alive: boolean;
  bob: number;
  facing: number;
  enraged: boolean;
};

export type Projectile = {
  id: number;
  alive: boolean;
  kind: TowerKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  damage: number;
  splash: number;
  slow: number;
  slowTime: number;
  damageType: DamageType;
  targetId: number;
  ttl: number;
  lastX: number;
  lastY: number;
  rot: number;
  pierce: number;
  crit: number;
  aftershock: boolean;
  hitIds: number[];
};

export type Particle = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "petal" | "spark" | "smoke";
};

export type Floater = {
  alive: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
  color: string;
};

export type Beam = {
  alive: boolean;
  points: Vec[];
  life: number;
};

export type Zone = {
  alive: boolean;
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  dps: number;
  slow: number;
};

export type DebugState = {
  open: boolean;
  path: boolean;
  pads: boolean;
  ranges: boolean;
  hits: boolean;
  labels: boolean;
  freeze: boolean;
  god: boolean;
  vault: boolean;
  step: boolean;
  fps: number;
  frameDt: number;
  dmg: number;
  goldIn: number;
  shots: number;
  spriteTech: SpriteTech;
};

export type GameSim = {
  gold: number;
  lives: number;
  wave: number;
  waveActive: boolean;
  waveTime: number;
  prep: number;
  speed: number;
  targeting: Targeting;
  selectedKind: TowerKind | null;
  selectedTower: number | null;
  hoverCol: number;
  hoverRow: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  floaters: Floater[];
  beams: Beam[];
  zones: Zone[];
  spawnQueue: { kind: EnemyKind; t: number }[];
  nextId: number;
  trauma: number;
  hitstop: number;
  elapsed: number;
  kills: number;
  leaks: number;
  won: boolean;
  lost: boolean;
  petalT: number;
  debug: DebugState;
};
