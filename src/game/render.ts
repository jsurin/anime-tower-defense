import type { Atlas } from "./assets";
import {
  CELL_H,
  CELL_W,
  COLS,
  ENEMIES,
  PLOTS,
  ROWS,
  TOWERS,
  WAYPOINTS,
  WORLD_H,
  WORLD_W,
  cellCenter,
  isBuildableCell,
  isPlot,
  ROMAN,
  nextRank,
  pointOnPath,
  towerStats,
} from "./config";
import type { GameSim, TowerKind } from "./types";
import { drawSprite3D, spriteSource } from "./sprite3d";

type DrawItem = { y: number; draw: () => void };
type Img = HTMLImageElement | HTMLCanvasElement;

function sheetFrame(
  ctx: CanvasRenderingContext2D,
  img: Img,
  frame: number,
  cols: number,
  rows: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  flip: boolean,
) {
  const fw = img.width / cols;
  const fh = img.height / rows;
  const i = ((frame % (cols * rows)) + cols * rows) % (cols * rows);
  const sx = (i % cols) * fw;
  const sy = Math.floor(i / cols) * fh;
  ctx.save();
  ctx.translate(dx, dy);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, sy, fw, fh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

function drawImageFeet(
  ctx: CanvasRenderingContext2D,
  img: Img,
  x: number,
  y: number,
  h: number,
  recoil = 0,
) {
  const aspect = img.width / img.height;
  const w = h * aspect;
  const squash = 1 - recoil * 0.08;
  ctx.drawImage(img, x - w / 2, y - h * squash, w, h * squash);
}

function contactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number) {
  const ry = Math.max(5, rx * 0.34);
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 1, x, y, rx);
  g.addColorStop(0, "rgba(8, 6, 10, 0.5)");
  g.addColorStop(0.55, "rgba(8, 6, 10, 0.22)");
  g.addColorStop(1, "rgba(8, 6, 10, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function depthScale(y: number) {
  return 0.84 + 0.22 * (y / WORLD_H);
}

function pathGlow(ctx: CanvasRenderingContext2D) {
  const samples = 140;
  const ribbon = (half: number) => {
    const left: { x: number; y: number }[] = [];
    const right: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const p = pointOnPath(i / samples);
      const h = half * (0.92 + 0.14 * (p.y / WORLD_H));
      left.push({ x: p.x + p.nx * h, y: p.y + p.ny * h });
      right.push({ x: p.x - p.nx * h, y: p.y - p.ny * h });
    }
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
  };
  ctx.save();
  ribbon(36);
  ctx.fillStyle = "rgba(92, 78, 58, 0.18)";
  ctx.fill();
  ribbon(28);
  ctx.fillStyle = "rgba(198, 178, 148, 0.78)";
  ctx.fill();
  ribbon(18);
  ctx.fillStyle = "rgba(232, 216, 186, 0.28)";
  ctx.fill();
  ctx.restore();
}

function atmosphere(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const heat = ctx.createRadialGradient(WORLD_W * 0.22, WORLD_H * 0.12, 40, WORLD_W * 0.28, WORLD_H * 0.2, 520);
  heat.addColorStop(0, "rgba(255, 214, 160, 0.1)");
  heat.addColorStop(1, "rgba(255, 214, 160, 0)");
  ctx.fillStyle = heat;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  const vignette = ctx.createRadialGradient(WORLD_W * 0.5, WORLD_H * 0.52, 280, WORLD_W * 0.5, WORLD_H * 0.55, 820);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(8, 6, 12, 0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}

function drawPlot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mode: "idle" | "ready" | "hover" | "taken",
) {
  ctx.save();
  ctx.translate(x, y + 3);
  ctx.beginPath();
  ctx.ellipse(0, 9, 26, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(16, 12, 8, 0.4)";
  ctx.fill();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-21, -8, 42, 18, 4);
  else ctx.rect(-21, -8, 42, 18);
  const g = ctx.createLinearGradient(-18, -10, 16, 14);
  if (mode === "hover") {
    g.addColorStop(0, "#b5a584");
    g.addColorStop(0.45, "#8c7d64");
    g.addColorStop(1, "#5a5042");
  } else if (mode === "ready") {
    g.addColorStop(0, "#978a72");
    g.addColorStop(0.5, "#74685a");
    g.addColorStop(1, "#4e463c");
  } else if (mode === "taken") {
    g.addColorStop(0, "#5c564c");
    g.addColorStop(1, "#3a352e");
  } else {
    g.addColorStop(0, "#7a7164");
    g.addColorStop(0.55, "#5e574c");
    g.addColorStop(1, "#433e36");
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = mode === "ready" || mode === "hover" ? "rgba(236, 226, 200, 0.55)" : "rgba(28, 22, 16, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-15, -4, 30, 9, 2);
  else ctx.rect(-15, -4, 30, 9);
  ctx.strokeStyle = "rgba(255, 244, 220, 0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function buildPads(ctx: CanvasRenderingContext2D, sim: GameSim) {
  const placing = !!sim.selectedKind;
  for (const p of PLOTS) {
    const { x, y } = cellCenter(p.col, p.row);
    const taken = sim.towers.some((t) => t.col === p.col && t.row === p.row);
    const hover = sim.hoverCol === p.col && sim.hoverRow === p.row;
    const mode = taken ? "taken" : hover && placing ? "hover" : placing ? "ready" : "idle";
    drawPlot(ctx, x, y, mode);
  }
  if (
    placing &&
    sim.hoverCol >= 0 &&
    isBuildableCell(sim.hoverCol, sim.hoverRow) &&
    !isPlot(sim.hoverCol, sim.hoverRow) &&
    !sim.towers.some((t) => t.col === sim.hoverCol && t.row === sim.hoverRow)
  ) {
    const x = (sim.hoverCol + 0.5) * CELL_W;
    const y = (sim.hoverRow + 0.5) * CELL_H;
    ctx.save();
    ctx.strokeStyle = "rgba(210, 196, 168, 0.4)";
    ctx.setLineDash([4, 5]);
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 20, y - 12, 40, 24, 4);
    else ctx.rect(x - 20, y - 12, 40, 24);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function rangeRing(ctx: CanvasRenderingContext2D, x: number, y: number, range: number, ok: boolean) {
  ctx.beginPath();
  ctx.arc(x, y, range, 0, Math.PI * 2);
  ctx.fillStyle = ok ? "rgba(232, 201, 160, 0.07)" : "rgba(80, 40, 36, 0.1)";
  ctx.fill();
  ctx.strokeStyle = ok ? "rgba(232, 201, 160, 0.45)" : "rgba(160, 70, 64, 0.5)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function hpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, ratio: number, boss: boolean) {
  const h = boss ? 7 : 5;
  ctx.fillStyle = "rgba(8, 6, 10, 0.82)";
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = "#2a1a16";
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = ratio > 0.45 ? "#3ecf5a" : ratio > 0.2 ? "#e6b84c" : "#d4453a";
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), h);
  ctx.strokeStyle = "rgba(232, 201, 160, 0.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
}

function ambientPetals(ctx: CanvasRenderingContext2D, t: number) {
  for (let i = 0; i < 18; i++) {
    const seed = i * 17.13;
    const x = ((seed * 90 + t * (12 + (i % 5) * 6)) % (WORLD_W + 40)) - 20;
    const y = (Math.sin(t * 0.4 + seed) * 40 + ((i * 83 + t * 18) % WORLD_H) + WORLD_H) % WORLD_H;
    const rot = t * 0.6 + seed;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = i % 3 === 0 ? "rgba(232, 90, 138, 0.55)" : "rgba(243, 236, 228, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDebugOverlays(ctx: CanvasRenderingContext2D, sim: GameSim) {
  const d = sim.debug;
  if (!d.path && !d.ranges && !d.hits && !d.labels) return;
  ctx.save();

  if (d.path) {
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(232, 90, 138, 0.85)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    for (let i = 1; i < WAYPOINTS.length; i++) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "700 11px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < WAYPOINTS.length; i++) {
      const p = WAYPOINTS[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(12, 11, 16, 0.8)";
      ctx.fill();
      ctx.strokeStyle = "rgba(232, 201, 160, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#e8c9a0";
      ctx.fillText(String(i), p.x, p.y + 0.5);
    }
    ctx.fillStyle = "#f3ece4";
    ctx.font = "600 12px 'DM Sans', sans-serif";
    ctx.fillText("GATE", WAYPOINTS[0].x + 22, WAYPOINTS[0].y - 16);
    const last = WAYPOINTS[WAYPOINTS.length - 1];
    ctx.fillText("TORII", last.x - 24, last.y - 16);
    ctx.restore();
  }

  if (d.ranges) {
    for (const t of sim.towers) {
      const stats = towerStats(t.kind, t.level);
      ctx.beginPath();
      ctx.arc(t.x, t.y, stats.range, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(232, 201, 160, 0.45)";
      ctx.lineWidth = 1.25;
      ctx.stroke();
    }
  }

  if (d.hits || d.labels) {
    ctx.font = "600 11px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    for (const e of sim.enemies) {
      if (!e.alive) continue;
      const def = ENEMIES[e.kind];
      if (d.hits) {
        ctx.beginPath();
        ctx.arc(e.x, e.y - 8, def.radius, 0, Math.PI * 2);
        ctx.strokeStyle = e.stunT > 0 ? "rgba(232, 201, 160, 0.9)" : "rgba(232, 90, 138, 0.7)";
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      if (d.labels) {
        const hp = Math.max(0, Math.round(e.hp));
        const line = `${e.kind} #${e.id}  ${hp}/${e.maxHp}`;
        const status = `${Math.round(e.progress * 100)}%${e.slow > 0 ? `  sl${Math.round(e.slow * 100)}` : ""}${e.stunT > 0 ? "  stun" : ""}${e.enraged ? "  rage" : ""}`;
        ctx.fillStyle = "rgba(12, 11, 16, 0.72)";
        ctx.fillRect(e.x - 54, e.y - 58, 108, 24);
        ctx.fillStyle = "#f3ece4";
        ctx.fillText(line, e.x, e.y - 42);
        ctx.fillStyle = "#e8c9a0";
        ctx.fillText(status, e.x, e.y - 30);
      }
    }
    if (d.hits) {
      for (const p of sim.projectiles) {
        if (!p.alive) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(243, 236, 228, 0.8)";
        ctx.stroke();
      }
    }
    if (d.labels) {
      for (const t of sim.towers) {
        const stats = towerStats(t.kind, t.level);
        ctx.fillStyle = "rgba(12, 11, 16, 0.7)";
        ctx.fillRect(t.x - 48, t.y + 22, 96, 14);
        ctx.fillStyle = "#e8c9a0";
        ctx.fillText(`${t.kind} ${ROMAN[t.level - 1]}  ${t.targeting}  ${stats.damage}`, t.x, t.y + 34);
      }
    }
  }
  ctx.restore();
}

function rankOrnaments(
  ctx: CanvasRenderingContext2D,
  kind: TowerKind,
  level: number,
  x: number,
  y: number,
  elapsed: number,
) {
  if (level < 2) return;
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3);
  if (kind === "yumi") {
    ctx.save();
    ctx.strokeStyle = level >= 3 ? `rgba(232, 90, 138, ${0.5 + pulse * 0.3})` : `rgba(232, 201, 160, ${0.4 + pulse * 0.2})`;
    ctx.lineWidth = level >= 3 ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.arc(x + 18, y - 52, 8, -0.7, 2.3);
    ctx.stroke();
    if (level >= 3) {
      for (let i = 0; i < 5; i++) {
        const a = elapsed * 1.5 + i * 1.256;
        ctx.fillStyle = "rgba(232, 90, 138, 0.75)";
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 22, y - 38 + Math.sin(a) * 11, 3.2, 1.6, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  if (kind === "ofuda" && level >= 3) {
    for (let i = 0; i < 3; i++) {
      const a = elapsed * 1.7 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = "rgba(232, 201, 160, 0.88)";
      ctx.fillRect(x + Math.cos(a) * 16 - 3, y - 38 + Math.sin(a) * 11 - 6, 6, 11);
    }
  }
  if (kind === "taiko") {
    ctx.strokeStyle = `rgba(212, 91, 91, ${0.28 + pulse * 0.4})`;
    ctx.lineWidth = level >= 3 ? 2.2 : 1.4;
    ctx.beginPath();
    ctx.arc(x, y - 28, 12 + level * 5 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  sim: GameSim,
  atlas: Atlas,
  reducedMotion: boolean,
) {
  const shake = reducedMotion ? 0 : sim.trauma * sim.trauma;
  const ox = (Math.sin(sim.elapsed * 37) * 10 + Math.sin(sim.elapsed * 53) * 6) * shake;
  const oy = (Math.cos(sim.elapsed * 41) * 8 + Math.sin(sim.elapsed * 29) * 5) * shake;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const fit = viewFit(ctx.canvas);
  ctx.fillStyle = "#0c0b10";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(fit.scale, 0, 0, fit.scale, fit.ox + ox * fit.scale, fit.oy + oy * fit.scale);

  ctx.drawImage(atlas.map, 0, 0, WORLD_W, WORLD_H);
  atmosphere(ctx);
  buildPads(ctx, sim);
  for (const z of sim.zones) {
    if (!z.alive) continue;
    const a = Math.max(0, z.life / z.max);
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(232, 90, 138, ${0.12 * a})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(232, 90, 138, ${0.45 * a})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ambientPetals(ctx, sim.petalT);

  const items: DrawItem[] = [];

  for (const t of sim.towers) {
    const img = atlas[t.kind];
    const base = t.kind === "taiko" ? 62 : t.kind === "kitsune" ? 58 : 56;
    const h = base * (1 + (t.level - 1) * 0.1) * depthScale(t.y);
    const stats = towerStats(t.kind, t.level);
    items.push({
      y: t.y + 8,
      draw: () => {
        if (sim.selectedTower === t.id) {
          rangeRing(ctx, t.x, t.y, stats.range, true);
          const nxt = nextRank(t.kind, t.level);
          if (nxt && nxt.range > stats.range + 1) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, nxt.range, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(232, 201, 160, 0.38)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 7]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        if (t.level > 1) {
          ctx.beginPath();
          ctx.ellipse(t.x, t.y + 8, 20 + t.level * 2, 7, 0, 0, Math.PI * 2);
          ctx.strokeStyle = t.level >= 3 ? "rgba(232, 90, 138, 0.8)" : "rgba(232, 201, 160, 0.6)";
          ctx.lineWidth = t.level >= 3 ? 2.4 : 1.6;
          ctx.stroke();
        }
        rankOrnaments(ctx, t.kind, t.level, t.x, t.y, sim.elapsed);
        if (stats.aura > 0) {
          const pulse = 0.5 + 0.5 * Math.sin(sim.elapsed * 2.4);
          ctx.beginPath();
          ctx.arc(t.x, t.y, stats.range, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 139, 116, ${0.07 + pulse * 0.06})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(74, 139, 116, ${0.3 + pulse * 0.25})`;
          ctx.setLineDash([4, 6]);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (t.flash > 0) {
          ctx.save();
          ctx.globalAlpha = 0.55 + t.flash;
          ctx.shadowColor = "#e8c9a0";
          ctx.shadowBlur = 18;
        }
        drawSprite3D(ctx, {
          img,
          sx: 0,
          sy: 0,
          sw: img.width,
          sh: img.height,
          x: t.x,
          y: t.y + 10,
          w: h * (img.width / img.height),
          h,
          tech: "flat",
          recoil: t.recoil,
          shadow: 22 + t.level * 3,
          reduced: reducedMotion,
        });
        if (t.flash > 0) ctx.restore();
        ctx.fillStyle = t.level >= 3 ? "#e85a8a" : "#e8c9a0";
        ctx.font = "700 11px 'DM Sans', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(ROMAN[t.level - 1] ?? "I", t.x, t.y + 20);
      },
    });
  }

  if (sim.selectedKind && sim.hoverCol >= 0) {
    const ok = isBuildableCell(sim.hoverCol, sim.hoverRow) && !sim.towers.some((t) => t.col === sim.hoverCol && t.row === sim.hoverRow);
    const x = (sim.hoverCol + 0.5) * CELL_W;
    const y = (sim.hoverRow + 0.5) * CELL_H;
    const stats = towerStats(sim.selectedKind, 1);
    items.push({
      y: y + 6,
      draw: () => {
        rangeRing(ctx, x, y, stats.range, ok);
      },
    });
  }

  for (const e of sim.enemies) {
    if (!e.alive) continue;
    const def = ENEMIES[e.kind];
    const img = atlas[e.kind];
    const h = (e.kind === "boss" ? 78 : e.kind === "oni" ? 64 : e.kind === "tengu" ? 54 : 44) * def.scale * depthScale(e.y);
    const frame = Math.floor(e.bob * 0.7) % 4;
    const bobY = e.kind === "yurei" ? Math.sin(e.bob) * 2 : 0;
    items.push({
      y: e.y,
      draw: () => {
        const src = spriteSource(img, frame, 2, 2);
        if (e.flash > 0) {
          ctx.save();
          ctx.filter = "brightness(2.4)";
        }
        drawSprite3D(ctx, {
          img,
          sx: src.sx,
          sy: src.sy,
          sw: src.sw,
          sh: src.sh,
          x: e.x,
          y: e.y + bobY,
          w: h * 0.92,
          h,
          flip: e.facing < 0,
          tech: "flat",
          shadow: e.kind === "boss" ? 28 : e.kind === "oni" ? 20 : 14,
          reduced: reducedMotion,
        });
        if (e.flash > 0) ctx.restore();
        if (e.slow > 0) {
          ctx.strokeStyle = "rgba(74, 139, 116, 0.7)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y - h * 0.45, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (e.stunT > 0) {
          ctx.strokeStyle = "rgba(232, 201, 160, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y - h * 0.55, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (e.enraged) {
          ctx.strokeStyle = "rgba(212, 91, 91, 0.85)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(e.x, e.y - h * 0.4, 24 + Math.sin(e.bob) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        hpBar(ctx, e.x, e.y - h - 8, e.kind === "boss" ? 64 : 36, e.hp / e.maxHp, e.kind === "boss");
      },
    });
  }

  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  for (const p of sim.projectiles) {
    if (!p.alive) continue;
    const img = p.kind === "yumi" ? atlas.arrow : p.kind === "ofuda" ? atlas.ofudaShot : atlas.foxfire;
    const frame = Math.floor(sim.elapsed * 10) % 4;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    const s = (p.kind === "ofuda" ? 28 : 22) * (1 + Math.min(p.pierce, 2) * 0.14);
    const fw = img.width / 2;
    const fh = img.height / 2;
    const i = frame % 4;
    if (p.pierce > 0 || p.crit > 0) {
      ctx.shadowColor = "#e85a8a";
      ctx.shadowBlur = 10;
    }
    ctx.drawImage(img, (i % 2) * fw, Math.floor(i / 2) * fh, fw, fh, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  for (const b of sim.beams) {
    ctx.save();
    ctx.strokeStyle = `rgba(232, 201, 160, ${Math.max(0, b.life * 5)})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = "#e8c9a0";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(b.points[0].x, b.points[0].y);
    for (let i = 1; i < b.points.length; i++) {
      const a = b.points[i - 1];
      const c = b.points[i];
      const mx = (a.x + c.x) / 2 + (Math.random() - 0.5) * 10;
      const my = (a.y + c.y) / 2 + (Math.random() - 0.5) * 10;
      ctx.lineTo(mx, my);
      ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  for (const p of sim.particles) {
    if (!p.alive) continue;
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    if (p.kind === "petal") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 8);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.font = "600 13px 'DM Sans', sans-serif";
  ctx.textAlign = "center";
  for (const f of sim.floaters) {
    if (!f.alive) continue;
    ctx.globalAlpha = Math.max(0, f.life / 0.7);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  drawDebugOverlays(ctx, sim);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function viewFit(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const dprX = canvas.width / Math.max(1, rect.width);
  const dprY = canvas.height / Math.max(1, rect.height);
  const scaleCss = Math.min(rect.width / WORLD_W, rect.height / WORLD_H);
  return {
    scale: scaleCss * dprX,
    ox: ((rect.width - WORLD_W * scaleCss) / 2) * dprX,
    oy: ((rect.height - WORLD_H * scaleCss) / 2) * dprY,
    scaleCss,
    oxCss: (rect.width - WORLD_W * scaleCss) / 2,
    oyCss: (rect.height - WORLD_H * scaleCss) / 2,
  };
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;
  if (!parent) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
}

export function eventToWorld(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WORLD_W, rect.height / WORLD_H);
  const ox = (rect.width - WORLD_W * scale) / 2;
  const oy = (rect.height - WORLD_H * scale) / 2;
  return {
    x: (clientX - rect.left - ox) / scale,
    y: (clientY - rect.top - oy) / scale,
  };
}
