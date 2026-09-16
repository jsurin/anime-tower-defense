import {
  CELL_H,
  CELL_W,
  COLS,
  ENEMIES,
  PATH_LEN,
  PREP_TIME,
  ROWS,
  SELL_RATE,
  START_GOLD,
  START_LIVES,
  TOWERS,
  WAVES,
  WAYPOINTS,
  WORLD_H,
  WORLD_W,
  isBuildableCell,
  nearestPlot,
  nextRank,
  pointOnPath,
  towerStats,
  earlyCallGold,
} from "./config";
import { defaultDebug, keepDebug } from "./debug";
import type {
  Enemy,
  EnemyKind,
  Floater,
  GameSim,
  Particle,
  Projectile,
  Targeting,
  Tower,
  TowerKind,
  Zone,
} from "./types";

export type SfxEvent =
  | "place"
  | "deny"
  | "shoot"
  | "drum"
  | "hit"
  | "death"
  | "leak"
  | "wave"
  | "win"
  | "lose"
  | "upgrade"
  | "sell"
  | "seal"
  | "fox"
  | "crit"
  | "enrage";

export type SimEvents = SfxEvent[];

function hypot2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function allocEnemy(sim: GameSim): Enemy {
  for (const e of sim.enemies) {
    if (!e.alive) return e;
  }
  const e: Enemy = {
    id: 0,
    kind: "imp",
    x: 0,
    y: 0,
    hp: 1,
    maxHp: 1,
    speed: 1,
    wp: 0,
    progress: 0,
    lane: 0,
    slow: 0,
    slowT: 0,
    stunT: 0,
    flash: 0,
    alive: false,
    bob: 0,
    facing: 1,
    enraged: false,
  };
  sim.enemies.push(e);
  return e;
}

function allocProj(sim: GameSim): Projectile {
  for (const p of sim.projectiles) {
    if (!p.alive) return p;
  }
  const p: Projectile = {
    id: 0,
    alive: false,
    kind: "yumi",
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    damage: 0,
    splash: 0,
    slow: 0,
    slowTime: 0,
    damageType: "physical",
    targetId: 0,
    ttl: 0,
    lastX: 0,
    lastY: 0,
    rot: 0,
    pierce: 0,
    crit: 0,
    aftershock: false,
    hitIds: [],
  };
  sim.projectiles.push(p);
  return p;
}

function allocParticle(sim: GameSim): Particle {
  let oldest = sim.particles[0];
  for (const p of sim.particles) {
    if (!p.alive) return p;
    if (!oldest || p.life < oldest.life) oldest = p;
  }
  if (sim.particles.length < 220) {
    const p: Particle = {
      alive: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      max: 1,
      size: 2,
      color: "#fff",
      kind: "petal",
    };
    sim.particles.push(p);
    return p;
  }
  return oldest;
}

function allocFloater(sim: GameSim): Floater {
  for (const f of sim.floaters) {
    if (!f.alive) return f;
  }
  const f: Floater = { alive: false, x: 0, y: 0, vy: 0, life: 0, text: "", color: "#fff" };
  sim.floaters.push(f);
  return f;
}

export function burst(sim: GameSim, x: number, y: number, color: string, n: number, kind: Particle["kind"] = "spark") {
  for (let i = 0; i < n; i++) {
    const p = allocParticle(sim);
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 140;
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(a) * s;
    p.vy = Math.sin(a) * s - 20;
    p.life = p.max = 0.25 + Math.random() * 0.45;
    p.size = kind === "petal" ? 4 + Math.random() * 5 : 2 + Math.random() * 3;
    p.color = color;
    p.kind = kind;
  }
}

export function spawnEnemy(sim: GameSim, kind: EnemyKind): Enemy {
  const def = ENEMIES[kind];
  const e = allocEnemy(sim);
  const start = pointOnPath(0);
  e.id = ++sim.nextId;
  e.kind = kind;
  e.lane = 0;
  e.progress = 0;
  e.wp = 1;
  e.x = start.x + start.nx * e.lane;
  e.y = start.y + start.ny * e.lane;
  e.hp = def.hp;
  e.maxHp = def.hp;
  e.speed = def.speed;
  e.slow = 0;
  e.slowT = 0;
  e.stunT = 0;
  e.flash = 0;
  e.alive = true;
  e.bob = Math.random() * Math.PI * 2;
  e.facing = 1;
  e.enraged = false;
  return e;
}

function applyDamage(
  sim: GameSim,
  e: Enemy,
  amount: number,
  type: "physical" | "magic",
  events: SimEvents,
  crit = false,
  noisy = true,
) {
  const def = ENEMIES[e.kind];
  let reduced = type === "physical" ? amount * (1 - def.armor) : amount * (1 - def.resist);
  if (crit) reduced *= 2;
  e.hp -= reduced;
  sim.debug.dmg += reduced;
  e.flash = crit ? 0.18 : 0.12;
  const f = allocFloater(sim);
  f.alive = true;
  f.x = e.x;
  f.y = e.y - 18;
  f.vy = -36;
  f.life = crit ? 0.85 : 0.7;
  f.text = crit ? `${Math.round(reduced)}!` : String(Math.round(reduced));
  f.color = crit ? "#e85a8a" : type === "magic" ? "#e8c9a0" : "#f3ece4";
  if (noisy) events.push(crit ? "crit" : "hit");
  sim.trauma = Math.min(1, sim.trauma + (e.kind === "boss" ? 0.22 : crit ? 0.14 : 0.08));
  if (e.hp <= 0) {
    e.alive = false;
    sim.gold += def.gold;
    sim.debug.goldIn += def.gold;
    sim.kills += 1;
    burst(sim, e.x, e.y, "#e85a8a", e.kind === "boss" ? 28 : 12, "petal");
    burst(sim, e.x, e.y, "#e8c9a0", 8, "spark");
    events.push("death");
    sim.hitstop = Math.max(sim.hitstop, e.kind === "boss" ? 0.12 : 0.04);
  }
}

function allocZone(sim: GameSim): Zone {
  for (const z of sim.zones) {
    if (!z.alive) return z;
  }
  const z: Zone = { alive: false, x: 0, y: 0, r: 40, life: 0, max: 1, dps: 0, slow: 0 };
  sim.zones.push(z);
  return z;
}

function spawnWard(sim: GameSim, x: number, y: number, r: number) {
  const z = allocZone(sim);
  z.alive = true;
  z.x = x;
  z.y = y;
  z.r = r;
  z.life = z.max = 1.35;
  z.dps = 14;
  z.slow = 0.2;
}

function findTarget(sim: GameSim, x: number, y: number, range: number, policy: Targeting): Enemy | null {
  const r2 = range * range;
  let best: Enemy | null = null;
  let bestScore = -Infinity;
  for (const e of sim.enemies) {
    if (!e.alive) continue;
    if (hypot2(x, y, e.x, e.y) > r2) continue;
    let score = 0;
    if (policy === "first") score = e.progress;
    else if (policy === "last") score = -e.progress;
    else if (policy === "strong") score = e.hp;
    else score = -Math.hypot(x - e.x, y - e.y);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

function fireTower(sim: GameSim, t: Tower, target: Enemy, events: SimEvents) {
  const def = TOWERS[t.kind];
  const stats = towerStats(t.kind, t.level);
  t.recoil = 1;
  t.targetId = target.id;
  sim.debug.shots += 1;
  if (t.kind === "taiko") {
    events.push("drum");
    const hit: Enemy[] = [target];
    let current: Enemy | null = target;
    for (let c = 1; c < stats.chain; c++) {
      let next: Enemy | null = null;
      let best = 150 * 150;
      for (const e of sim.enemies) {
        if (!e.alive || hit.includes(e)) continue;
        const d = hypot2(current!.x, current!.y, e.x, e.y);
        if (d < best) {
          best = d;
          next = e;
        }
      }
      if (!next) break;
      hit.push(next);
      current = next;
    }
    const pts = hit.map((e) => ({ x: e.x, y: e.y - 10 }));
    pts.unshift({ x: t.x, y: t.y - 36 });
    sim.beams.push({ alive: true, points: pts, life: 0.18 });
    hit.forEach((e, i) => {
      const crit = Math.random() < stats.crit;
      applyDamage(sim, e, stats.damage * Math.pow(0.72, i), def.damageType, events, crit);
      if (i === 0 && stats.stun > 0) e.stunT = Math.max(e.stunT, stats.stun);
    });
    return;
  }
  events.push(t.kind === "ofuda" ? "seal" : t.kind === "kitsune" ? "fox" : "shoot");
  const p = allocProj(sim);
  p.id = ++sim.nextId;
  p.alive = true;
  p.kind = t.kind;
  p.x = t.x;
  p.y = t.y - 28;
  p.speed = def.projectileSpeed;
  p.damage = stats.damage;
  p.splash = stats.splash;
  p.slow = stats.slow;
  p.slowTime = stats.slowTime;
  p.damageType = def.damageType;
  p.targetId = target.id;
  p.ttl = 1.6;
  p.lastX = p.x;
  p.lastY = p.y;
  p.pierce = stats.pierce;
  p.crit = stats.crit;
  p.aftershock = stats.aftershock;
  p.hitIds.length = 0;
  const dx = target.x - p.x;
  const dy = target.y - 12 - p.y;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * p.speed;
  p.vy = (dy / d) * p.speed;
  p.rot = Math.atan2(p.vy, p.vx);
}

function updateEnemies(sim: GameSim, dt: number, events: SimEvents) {
  for (const e of sim.enemies) {
    if (!e.alive) continue;
    e.flash = Math.max(0, e.flash - dt);
    e.bob += dt * (e.kind === "yurei" ? 4 : 8);
    if (e.kind === "boss" && !e.enraged && e.hp <= e.maxHp * 0.5) {
      e.enraged = true;
      e.speed *= 1.55;
      e.flash = 0.45;
      events.push("enrage");
      sim.hitstop = Math.max(sim.hitstop, 0.1);
      sim.trauma = 1;
      burst(sim, e.x, e.y, "#d45b5b", 22, "smoke");
      const rage = allocFloater(sim);
      rage.alive = true;
      rage.x = e.x;
      rage.y = e.y - 36;
      rage.vy = -28;
      rage.life = 1.1;
      rage.text = "RAGE";
      rage.color = "#d45b5b";
      for (let i = 0; i < 4; i++) {
        const add = spawnEnemy(sim, "imp");
        add.progress = Math.max(0, e.progress - 0.012);
        add.lane = 0;
        const p = pointOnPath(add.progress);
        add.x = p.x + p.nx * add.lane;
        add.y = p.y + p.ny * add.lane;
      }
    }
    if (e.stunT > 0) {
      e.stunT -= dt;
      continue;
    }
    if (sim.debug.freeze) continue;
    if (e.slowT > 0) {
      e.slowT -= dt;
      if (e.slowT <= 0) e.slow = 0;
    }
    const spd = e.speed * (1 - e.slow);
    e.progress += (spd * dt) / PATH_LEN;
    if (e.progress >= 1) {
      e.alive = false;
      e.progress = 1;
      sim.leaks += 1;
      events.push("leak");
      sim.trauma = Math.min(1, sim.trauma + 0.35);
      burst(sim, e.x, e.y, "#d45b5b", 10, "smoke");
      if (!sim.debug.god) {
        sim.lives -= 1;
        if (sim.lives <= 0) {
          sim.lost = true;
          events.push("lose");
        }
      }
      continue;
    }
    const p = pointOnPath(e.progress);
    e.x = p.x + p.nx * e.lane;
    e.y = p.y + p.ny * e.lane;
    e.facing = p.tx < -0.25 ? -1 : p.tx > 0.25 ? 1 : e.facing;
    e.wp = Math.min(WAYPOINTS.length - 1, 1 + Math.floor(e.progress * (WAYPOINTS.length - 1)));
  }
}

function updateProjectiles(sim: GameSim, dt: number, events: SimEvents) {
  for (const p of sim.projectiles) {
    if (!p.alive) continue;
    p.ttl -= dt;
    const target = sim.enemies.find((e) => e.alive && e.id === p.targetId && !p.hitIds.includes(e.id));
    if (target) {
      const dx = target.x - p.x;
      const dy = target.y - 10 - p.y;
      const d = Math.hypot(dx, dy) || 1;
      p.vx = (dx / d) * p.speed;
      p.vy = (dy / d) * p.speed;
      p.rot = Math.atan2(p.vy, p.vx);
      if (d < 16 + ENEMIES[target.kind].radius) {
        const crit = Math.random() < p.crit;
        applyDamage(sim, target, p.damage, p.damageType, events, crit);
        if (p.slow > 0) {
          target.slow = Math.max(target.slow, p.slow);
          target.slowT = Math.max(target.slowT, p.slowTime);
        }
        if (p.splash > 0) {
          const s2 = p.splash * p.splash;
          for (const e of sim.enemies) {
            if (!e.alive || e.id === target.id) continue;
            if (hypot2(p.x, p.y, e.x, e.y) <= s2) {
              applyDamage(sim, e, p.damage * 0.55, p.damageType, events, false, false);
              if (p.slow > 0) {
                e.slow = Math.max(e.slow, p.slow * 0.7);
                e.slowT = Math.max(e.slowT, p.slowTime * 0.7);
              }
            }
          }
          if (p.aftershock) spawnWard(sim, p.x, p.y, p.splash * 0.7);
        }
        burst(sim, p.x, p.y, p.kind === "kitsune" ? "#4a8b74" : "#e8c9a0", 6, "spark");
        p.hitIds.push(target.id);
        if (p.hitIds.length <= p.pierce) {
          let next: Enemy | null = null;
          let best = 110 * 110;
          for (const e of sim.enemies) {
            if (!e.alive || p.hitIds.includes(e.id)) continue;
            const d2 = hypot2(p.x, p.y, e.x, e.y);
            if (d2 < best) {
              best = d2;
              next = e;
            }
          }
          if (next) {
            p.targetId = next.id;
            p.ttl = Math.max(p.ttl, 0.55);
            continue;
          }
        }
        p.alive = false;
        continue;
      }
    } else if (p.ttl < 0.4) {
      p.alive = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.ttl <= 0 || p.x < -40 || p.y < -40 || p.x > WORLD_W + 40 || p.y > WORLD_H + 40) {
      p.alive = false;
    }
  }
}

function updateTowers(sim: GameSim, dt: number, events: SimEvents) {
  for (const t of sim.towers) {
    t.recoil = Math.max(0, t.recoil - dt * 4);
    t.flash = Math.max(0, t.flash - dt);
    t.cooldown -= dt;
    const stats = towerStats(t.kind, t.level);
    if (stats.aura > 0) {
      const r2 = stats.range * stats.range;
      for (const e of sim.enemies) {
        if (!e.alive) continue;
        if (hypot2(t.x, t.y, e.x, e.y) > r2) continue;
        e.slow = Math.max(e.slow, stats.aura);
        e.slowT = Math.max(e.slowT, 0.3);
      }
    }
    if (t.cooldown > 0) continue;
    const target = findTarget(sim, t.x, t.y, stats.range, t.targeting);
    if (!target) continue;
    t.cooldown = 1 / stats.fireRate;
    fireTower(sim, t, target, events);
  }
}

function updateFx(sim: GameSim, dt: number) {
  sim.trauma = Math.max(0, sim.trauma - dt * 1.6);
  sim.petalT += dt;
  for (const p of sim.particles) {
    if (!p.alive) continue;
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.kind === "petal" ? 30 : 80) * dt;
    if (p.life <= 0) p.alive = false;
  }
  for (const f of sim.floaters) {
    if (!f.alive) continue;
    f.life -= dt;
    f.y += f.vy * dt;
    if (f.life <= 0) f.alive = false;
  }
  for (const b of sim.beams) {
    b.life -= dt;
    if (b.life <= 0) b.alive = false;
  }
  sim.beams = sim.beams.filter((b) => b.alive);
  for (const z of sim.zones) {
    if (!z.alive) continue;
    z.life -= dt;
    if (z.life <= 0) {
      z.alive = false;
      continue;
    }
    const r2 = z.r * z.r;
    for (const e of sim.enemies) {
      if (!e.alive) continue;
      if (hypot2(z.x, z.y, e.x, e.y) > r2) continue;
      e.hp -= z.dps * dt;
      sim.debug.dmg += z.dps * dt;
      e.slow = Math.max(e.slow, z.slow);
      e.slowT = Math.max(e.slowT, 0.25);
      if (e.hp <= 0) {
        e.alive = false;
        sim.gold += ENEMIES[e.kind].gold;
        sim.debug.goldIn += ENEMIES[e.kind].gold;
        sim.kills += 1;
        burst(sim, e.x, e.y, "#e85a8a", 10, "petal");
      }
    }
  }
}

function tickSpawns(sim: GameSim, dt: number, events: SimEvents) {
  if (!sim.waveActive) return;
  sim.waveTime += dt;
  const still = [];
  for (const s of sim.spawnQueue) {
    s.t -= dt;
    if (s.t <= 0) spawnEnemy(sim, s.kind);
    else still.push(s);
  }
  sim.spawnQueue = still;
  const living = sim.enemies.some((e) => e.alive);
  if (!living && sim.spawnQueue.length === 0 && sim.waveTime > 0.4) {
    sim.waveActive = false;
    if (sim.wave >= WAVES.length) {
      sim.won = true;
      events.push("win");
    } else {
      sim.prep = PREP_TIME;
    }
  }
}

export function createSim(): GameSim {
  return {
    gold: START_GOLD,
    lives: START_LIVES,
    wave: 0,
    waveActive: false,
    waveTime: 0,
    prep: PREP_TIME,
    speed: 1,
    targeting: "first",
    selectedKind: "yumi",
    selectedTower: null,
    hoverCol: -1,
    hoverRow: -1,
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floaters: [],
    beams: [],
    zones: [],
    spawnQueue: [],
    nextId: 1,
    trauma: 0,
    hitstop: 0,
    elapsed: 0,
    kills: 0,
    leaks: 0,
    won: false,
    lost: false,
    petalT: 0,
    debug: defaultDebug(),
  };
}

export function resetSim(sim: GameSim) {
  const debug = keepDebug(sim.debug);
  Object.assign(sim, createSim());
  sim.debug = debug;
}

export function startWave(sim: GameSim, events: SimEvents) {
  if (sim.waveActive || sim.won || sim.lost) return;
  if (sim.wave >= WAVES.length) return;
  if (sim.prep > 2) {
    sim.gold += earlyCallGold(sim.prep);
  }
  sim.wave += 1;
  const wave = WAVES[sim.wave - 1];
  sim.waveActive = true;
  sim.waveTime = 0;
  sim.prep = 0;
  sim.spawnQueue = [];
  for (const s of wave.spawns) {
    for (let i = 0; i < s.count; i++) {
      sim.spawnQueue.push({ kind: s.kind, t: s.delay + i * s.interval });
    }
  }
  events.push("wave");
}

export function occupied(sim: GameSim, col: number, row: number) {
  return sim.towers.some((t) => t.col === col && t.row === row);
}

export function tryPlace(sim: GameSim, col: number, row: number, events: SimEvents): boolean {
  if (!sim.selectedKind) return false;
  if (!isBuildableCell(col, row) || occupied(sim, col, row)) {
    events.push("deny");
    return false;
  }
  const def = TOWERS[sim.selectedKind];
  if (!sim.debug.vault && sim.gold < def.cost) {
    events.push("deny");
    return false;
  }
  if (!sim.debug.vault) sim.gold -= def.cost;
  const { x, y } = { x: (col + 0.5) * CELL_W, y: (row + 0.5) * CELL_H };
  const t: Tower = {
    id: ++sim.nextId,
    kind: sim.selectedKind,
    col,
    row,
    x,
    y,
    level: 1,
    cooldown: 0.2,
    spent: def.cost,
    recoil: 0,
    targetId: 0,
    flash: 0,
    targeting: sim.targeting,
  };
  sim.towers.push(t);
  sim.selectedTower = null;
  burst(sim, x, y, "#e8c9a0", 8, "spark");
  events.push("place");
  return true;
}

export function tryUpgrade(sim: GameSim, events: SimEvents) {
  const t = sim.towers.find((x) => x.id === sim.selectedTower);
  if (!t) return;
  const next = nextRank(t.kind, t.level);
  if (!next) return;
  if (!sim.debug.vault && sim.gold < next.cost) {
    events.push("deny");
    return;
  }
  if (!sim.debug.vault) sim.gold -= next.cost;
  t.spent += next.cost;
  t.level += 1;
  t.flash = 0.45;
  burst(sim, t.x, t.y, TOWERS[t.kind].color, 16, "spark");
  burst(sim, t.x, t.y, "#e8c9a0", 8, "petal");
  sim.hitstop = Math.max(sim.hitstop, 0.06);
  events.push("upgrade");
}

export function trySell(sim: GameSim, events: SimEvents) {
  const i = sim.towers.findIndex((x) => x.id === sim.selectedTower);
  if (i < 0) return;
  const t = sim.towers[i];
  sim.gold += Math.floor(t.spent * SELL_RATE);
  sim.towers.splice(i, 1);
  sim.selectedTower = null;
  events.push("sell");
}

export function worldToCell(x: number, y: number) {
  return {
    col: Math.floor(x / CELL_W),
    row: Math.floor(y / CELL_H),
  };
}

export function pointerCell(x: number, y: number) {
  const plot = nearestPlot(x, y, 40);
  if (plot) return { col: plot.col, row: plot.row };
  const col = Math.max(0, Math.min(COLS - 1, Math.floor(x / CELL_W)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(y / CELL_H)));
  return { col, row };
}

export function updateSim(sim: GameSim, dt: number, events: SimEvents) {
  const capped = Math.min(dt, 0.1);
  sim.elapsed += capped;
  if (sim.won || sim.lost) {
    updateFx(sim, capped);
    return;
  }
  if (sim.hitstop > 0) {
    sim.hitstop -= capped;
    updateFx(sim, capped * 0.3);
    return;
  }
  const step = capped * sim.speed;
  if (!sim.waveActive && sim.prep > 0) {
    if (sim.towers.length === 0 && sim.prep <= 1.2) {
      sim.prep = 1.2;
    } else {
      sim.prep -= step;
      if (sim.prep <= 0) startWave(sim, events);
    }
  }
  tickSpawns(sim, step, events);
  updateTowers(sim, step, events);
  updateProjectiles(sim, step, events);
  updateEnemies(sim, step, events);
  updateFx(sim, step);
}

export function scoreOf(sim: GameSim) {
  return sim.wave * 120 + sim.kills * 8 + sim.lives * 25 + sim.gold;
}

export function debugKillLiving(sim: GameSim) {
  for (const e of sim.enemies) e.alive = false;
  for (const p of sim.projectiles) p.alive = false;
  sim.spawnQueue = [];
}

export function debugSkipWave(sim: GameSim, events: SimEvents) {
  debugKillLiving(sim);
  if (sim.waveActive) {
    sim.waveActive = false;
    if (sim.wave >= WAVES.length) {
      sim.won = true;
      events.push("win");
    } else {
      sim.prep = PREP_TIME;
    }
  }
}

export function debugJumpWave(sim: GameSim, waveId: number, events: SimEvents) {
  const n = Math.max(1, Math.min(WAVES.length, waveId));
  debugKillLiving(sim);
  sim.won = false;
  sim.lost = false;
  sim.waveActive = false;
  sim.wave = n - 1;
  sim.prep = 0;
  startWave(sim, events);
}

export function debugMaxRank(sim: GameSim, events: SimEvents) {
  const vault = sim.debug.vault;
  sim.debug.vault = true;
  for (let i = 0; i < 4; i++) tryUpgrade(sim, events);
  sim.debug.vault = vault;
}

export function debugFillLives(sim: GameSim) {
  sim.lives = START_LIVES;
  sim.lost = false;
}
