import { ENEMIES, WAVES, isBuildableCell, towerStats } from "./config";
import type { DebugState, EnemyKind, GameSim } from "./types";

export function defaultDebug(): DebugState {
  return {
    open: false,
    path: false,
    pads: false,
    ranges: false,
    hits: false,
    labels: false,
    freeze: false,
    god: false,
    vault: false,
    step: false,
    fps: 0,
    frameDt: 0,
    dmg: 0,
    goldIn: 0,
    shots: 0,
    spriteTech: "flat",
  };
}

export function keepDebug(prev: DebugState | undefined): DebugState {
  const next = defaultDebug();
  if (!prev) return next;
  next.open = prev.open;
  next.path = prev.path;
  next.pads = prev.pads;
  next.ranges = prev.ranges;
  next.hits = prev.hits;
  next.labels = prev.labels;
  next.freeze = prev.freeze;
  next.god = prev.god;
  next.vault = prev.vault;
  next.spriteTech = "flat";
  return next;
}

export function debugSnapshot(sim: GameSim) {
  return {
    gold: sim.gold,
    lives: sim.lives,
    wave: sim.wave,
    waveActive: sim.waveActive,
    prep: Number(sim.prep.toFixed(2)),
    speed: sim.speed,
    towers: sim.towers.map((t) => ({
      id: t.id,
      kind: t.kind,
      level: t.level,
      cell: [t.col, t.row],
      targeting: t.targeting,
      range: towerStats(t.kind, t.level).range,
      dmg: towerStats(t.kind, t.level).damage,
    })),
    enemies: sim.enemies
      .filter((e) => e.alive)
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        hp: Math.round(e.hp),
        max: e.maxHp,
        progress: Number(e.progress.toFixed(3)),
        slow: e.slow,
        stun: Number(e.stunT.toFixed(2)),
        enraged: e.enraged,
      })),
    queue: sim.spawnQueue.map((s) => ({ kind: s.kind, t: Number(s.t.toFixed(2)) })),
    meters: {
      dmg: Math.round(sim.debug.dmg),
      goldIn: sim.debug.goldIn,
      shots: sim.debug.shots,
      kills: sim.kills,
      leaks: sim.leaks,
    },
    flags: {
      god: sim.debug.god,
      vault: sim.debug.vault,
      freeze: sim.debug.freeze,
      path: sim.debug.path,
      pads: sim.debug.pads,
      ranges: sim.debug.ranges,
      hits: sim.debug.hits,
      labels: sim.debug.labels,
      sprite: sim.debug.spriteTech,
    },
    hover: { col: sim.hoverCol, row: sim.hoverRow, pad: isBuildableCell(sim.hoverCol, sim.hoverRow) },
  };
}

export const SPAWN_KINDS: EnemyKind[] = ["imp", "tengu", "oni", "yurei", "boss"];

export function enemyLabel(kind: EnemyKind) {
  return ENEMIES[kind].name;
}

export function waveNames() {
  return WAVES.map((w) => w.name);
}
