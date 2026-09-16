import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DebugLedger } from "@/components/game/DebugLedger";
import { loadAtlas, type Atlas } from "@/game/assets";
import { isMuted, playSfx, resumeIfNeeded, setMuted, unlockAudio } from "@/game/audio";
import {
  earlyCallGold,
  nextRank,
  rankOf,
  rankTags,
  ROMAN,
  SAVE_KEY,
  SELL_RATE,
  TOWER_ORDER,
  TOWERS,
  WAVES,
  waveHint as hintForWave,
} from "@/game/config";
import { patchHud, resetHud, useHud } from "@/game/hud";
import { eventToWorld, renderFrame, resizeCanvas } from "@/game/render";
import {
  createSim,
  occupied,
  pointerCell,
  resetSim,
  scoreOf,
  startWave,
  tryPlace,
  trySell,
  tryUpgrade,
  updateSim,
  spawnEnemy,
  type SimEvents,
} from "@/game/sim";
import { debugSnapshot } from "@/game/debug";
import type { GameSim, RankStats, Targeting, TowerKind } from "@/game/types";
import { cn } from "@/lib/utils";

type Screen = "title" | "play";

function TowerGlyph({ kind }: { kind: TowerKind }) {
  const stroke = kind === "yumi" ? "#c45c4a" : kind === "ofuda" ? "#e8c9a0" : kind === "kitsune" ? "#e85a8a" : "#4a8b74";
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-ink-soft ring-1 ring-border">
      <svg viewBox="0 0 32 32" className="size-7" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {kind === "yumi" && (
          <>
            <path d="M8 6c8 5 8 15 0 20" />
            <path d="M8 6l16 10L8 26" />
            <path d="M6 16h10" />
          </>
        )}
        {kind === "ofuda" && (
          <>
            <rect x="10" y="4" width="12" height="24" rx="1.5" />
            <path d="M13 10h6M13 14h6M14 19h4" />
          </>
        )}
        {kind === "kitsune" && (
          <>
            <path d="M6 14l5-8 5 6 5-6 5 8-5 10H11z" />
            <path d="M12 18h8" />
          </>
        )}
        {kind === "taiko" && (
          <>
            <ellipse cx="16" cy="16" rx="10" ry="7" />
            <path d="M6 16v4c0 4 4 7 10 7s10-3 10-7v-4" />
            <path d="M4 10l6 4M28 10l-6 4" />
          </>
        )}
      </svg>
    </span>
  );
}

function readBest() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { best?: number };
    return parsed.best ?? 0;
  } catch {
    return 0;
  }
}

function writeBest(score: number) {
  try {
    const best = Math.max(readBest(), score);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, best }));
    return best;
  } catch {
    return score;
  }
}

function syncHud(sim: GameSim, extra: Partial<ReturnType<typeof useHud.getState>> = {}) {
  const t = sim.towers.find((x) => x.id === sim.selectedTower);
  const wave = WAVES[Math.max(0, sim.wave - 1)];
  const rank = t ? rankOf(t.kind, t.level) : null;
  const nxt = t ? nextRank(t.kind, t.level) : null;
  patchHud({
    gold: Math.floor(sim.gold),
    lives: sim.lives,
    wave: sim.wave,
    waveName: sim.waveActive ? (wave?.name ?? "Wave") : sim.won ? "Victory" : "Prepare",
    waveActive: sim.waveActive,
    waveHint: hintForWave(sim.wave, sim.waveActive),
    prep: sim.prep,
    callBonus: earlyCallGold(sim.prep),
    speed: sim.speed,
    targeting: t?.targeting ?? sim.targeting,
    selectedKind: sim.selectedKind,
    selectedLevel: t?.level ?? 0,
    selectedSpent: t?.spent ?? 0,
    selectedKindPlaced: t?.kind ?? null,
    selectedRankName: rank?.name ?? "",
    selectedPerk: rank?.blurb ?? "",
    nextRankName: nxt?.name ?? "",
    nextPerk: nxt?.blurb ?? "",
    upgradeCost: nxt?.cost ?? 0,
    remaining: sim.spawnQueue.length + sim.enemies.filter((e) => e.alive).length,
    won: sim.won,
    lost: sim.lost,
    kills: sim.kills,
    score: scoreOf(sim),
    ...extra,
  });
}

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("title");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const atlasRef = useRef<Atlas | null>(null);
  const simRef = useRef<GameSim | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);
  const [ledger, setLedger] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAtlas()
      .then((atlas) => {
        if (!alive) return;
        atlasRef.current = atlas;
        simRef.current = createSim();
        resetHud(readBest());
        setReady(true);
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Could not load art"));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current;
    const sim = simRef.current;
    const atlas = atlasRef.current;
    if (!canvas || !sim || !atlas) return;

    resizeCanvas(canvas);
    const onResize = () => resizeCanvas(canvas);
    window.addEventListener("resize", onResize);

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      let dt = (now - last) / 1000;
      last = now;
      dt = Math.min(dt, 0.1);
      sim.debug.frameDt = dt;
      sim.debug.fps = Math.round(sim.debug.fps * 0.85 + (dt > 0 ? 1 / dt : 0) * 0.15);
      const stepping = sim.debug.step;
      const events: SimEvents = [];
      if (!pausedRef.current || stepping) {
        updateSim(sim, dt, events);
        sim.debug.step = false;
      }
      for (const ev of events) playSfx(ev);
      if (events.includes("win") || events.includes("lose")) {
        const best = writeBest(scoreOf(sim));
        patchHud({ best, won: sim.won, lost: sim.lost, score: scoreOf(sim) });
      }
      hudAcc += dt;
      if (hudAcc > 0.12 || events.length) {
        hudAcc = 0;
        syncHud(sim, { paused: pausedRef.current });
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        try {
          renderFrame(ctx, sim, atlas, reducedRef.current);
        } catch (err) {
          sim.debug.labels = true;
          console.warn("frame", err);
        }
      }
    };
    raf = requestAnimationFrame(loop);

    const onVis = () => {
      if (document.visibilityState === "visible") resumeIfNeeded();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const sim = simRef.current;
      if (!sim) return;
      const events: SimEvents = [];
      if (e.key === "Escape") {
        pausedRef.current = !pausedRef.current;
        patchHud({ paused: pausedRef.current });
      } else if (e.key === "`" || e.key === "Backquote" || e.key === "F2") {
        e.preventDefault();
        const next = !sim.debug.open;
        sim.debug.open = next;
        setLedger(next);
      } else if (e.key === " ") {
        e.preventDefault();
        startWave(sim, events);
      } else if (e.key === "1") {
        sim.selectedKind = "yumi";
        sim.selectedTower = null;
      } else if (e.key === "2") {
        sim.selectedKind = "ofuda";
        sim.selectedTower = null;
      } else if (e.key === "3") {
        sim.selectedKind = "kitsune";
        sim.selectedTower = null;
      } else if (e.key === "4") {
        sim.selectedKind = "taiko";
        sim.selectedTower = null;
      } else if (e.key === "u" || e.key === "U") tryUpgrade(sim, events);
      else if (e.key === "s" || e.key === "S") trySell(sim, events);
      else if (e.key === "f" || e.key === "F") sim.speed = sim.speed === 1 ? 2 : 1;
      for (const ev of events) playSfx(ev);
      syncHud(sim);
    };
    window.addEventListener("keydown", onKey);
    const w = window as Window & {
      __gameDebug?: {
        open: () => void;
        snapshot: () => unknown;
        spawn: (k: "imp" | "tengu" | "oni" | "yurei" | "boss") => void;
      };
    };
    w.__gameDebug = {
      open: () => {
        const sim = simRef.current;
        if (!sim) return;
        sim.debug.open = true;
        setLedger(true);
      },
      snapshot: () => {
        const sim = simRef.current;
        return sim ? debugSnapshot(sim) : null;
      },
      spawn: (k) => {
        const sim = simRef.current;
        if (!sim) return;
        spawnEnemy(sim, k);
        syncHud(sim);
      },
    };
    return () => {
      window.removeEventListener("keydown", onKey);
      delete w.__gameDebug;
    };
  }, [screen]);

  const callWave = () => {
    const sim = simRef.current;
    if (!sim) return;
    const events: SimEvents = [];
    startWave(sim, events);
    for (const ev of events) playSfx(ev);
    syncHud(sim);
  };

  const begin = () => {
    if (!ready || !atlasRef.current || !simRef.current) return;
    unlockAudio();
    const sim = simRef.current;
    resetSim(sim);
    pausedRef.current = false;
    resetHud(readBest());
    syncHud(sim);
    setScreen("play");
  };

  if (err) {
    return (
      <main className="flex h-dvh items-center justify-center bg-ink px-6 text-center text-paper">
        <p className="font-display text-lg">{err}</p>
      </main>
    );
  }

  if (screen === "title") {
    return <TitleScreen onPlay={begin} ready={ready} />;
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-ink text-paper">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
        onPointerMove={(e) => {
            const sim = simRef.current;
            const canvas = canvasRef.current;
            if (!sim || !canvas) return;
            const w = eventToWorld(canvas, e.clientX, e.clientY);
            const cell = pointerCell(w.x, w.y);
            sim.hoverCol = cell.col;
            sim.hoverRow = cell.row;
          }}
          onPointerLeave={() => {
            const sim = simRef.current;
            if (sim) {
              sim.hoverCol = -1;
              sim.hoverRow = -1;
            }
          }}
          onPointerDown={(e) => {
            unlockAudio();
            const sim = simRef.current;
            const canvas = canvasRef.current;
            if (!sim || !canvas || pausedRef.current || sim.won || sim.lost) return;
            const w = eventToWorld(canvas, e.clientX, e.clientY);
            const cell = pointerCell(w.x, w.y);
            const events: SimEvents = [];
            if (occupied(sim, cell.col, cell.row)) {
              const t = sim.towers.find((x) => x.col === cell.col && x.row === cell.row);
              const inspecting = !sim.selectedKind;
              const already = t && t.id === sim.selectedTower;
              sim.selectedTower = t?.id ?? null;
              sim.selectedKind = null;
              if (inspecting && already && e.detail === 2) tryUpgrade(sim, events);
            } else if (sim.selectedKind) {
              tryPlace(sim, cell.col, cell.row, events);
            } else {
              sim.selectedTower = null;
            }
            for (const ev of events) playSfx(ev);
            syncHud(sim);
          }}
        />
      <TopHud
        onPause={() => {
          pausedRef.current = !pausedRef.current;
          patchHud({ paused: pausedRef.current });
        }}
        onMute={() => {
          const next = !isMuted();
          setMuted(next);
          patchHud({ muted: next });
        }}
        onWave={callWave}
      />
      <PauseWinLose
          onResume={() => {
            pausedRef.current = false;
            patchHud({ paused: false });
          }}
          onMenu={() => setScreen("title")}
          onRetry={begin}
          onLedger={() => {
            const sim = simRef.current;
            if (sim) sim.debug.open = true;
            setLedger(true);
            pausedRef.current = false;
            patchHud({ paused: false });
          }}
        />
        <CanvasChrome
          onUpgrade={() => {
            const sim = simRef.current;
            if (!sim) return;
            const events: SimEvents = [];
            tryUpgrade(sim, events);
            for (const ev of events) playSfx(ev);
            syncHud(sim);
          }}
          onSell={() => {
            const sim = simRef.current;
            if (!sim) return;
            const events: SimEvents = [];
            trySell(sim, events);
            for (const ev of events) playSfx(ev);
            syncHud(sim);
          }}
          onTarget={(policy) => {
            const sim = simRef.current;
            if (!sim) return;
            const t = sim.towers.find((x) => x.id === sim.selectedTower);
            if (t) t.targeting = policy;
            else sim.targeting = policy;
            syncHud(sim);
          }}
        />
        <DebugLedger
          open={ledger}
          simRef={simRef}
          pausedRef={pausedRef}
          onClose={() => {
            const sim = simRef.current;
            if (sim) sim.debug.open = false;
            setLedger(false);
          }}
          onSync={() => {
            const sim = simRef.current;
            if (sim) syncHud(sim);
          }}
          playSfx={playSfx}
        />
      <BottomBar
        onSelect={(kind) => {
          const sim = simRef.current;
          if (!sim) return;
          sim.selectedKind = sim.selectedKind === kind ? null : kind;
          sim.selectedTower = null;
          syncHud(sim);
        }}
      />
    </main>
  );
}

function TitleScreen({ onPlay, ready }: { onPlay: () => void; ready: boolean }) {
  const best = useHud((s) => s.best);
  return (
    <main className="relative h-dvh overflow-hidden bg-ink text-paper">
      <img src="/game/title.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_28%]" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/82 to-ink/20" />
      <div className="relative flex h-full max-w-xl flex-col justify-end gap-6 px-6 pb-10 pt-16 sm:justify-center sm:pb-0 sm:pl-12">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-crest">Dusk jinja · three-quarter light</p>
        <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Sakura Sentinel
        </h1>
        <p className="font-display text-lg text-sakura">桜の守護者</p>
        <p className="max-w-sm text-sm leading-relaxed text-paper-muted">
          A painted shrine garden. Spirit towers stand as miniatures along the wet sandō. Hold the torii through ten yokai waves.
        </p>
        <p className="max-w-sm text-sm text-paper-subtle">
          Plant on a pale pad. Consecrate to rank up. Call early for tribute.
        </p>
        {best > 0 && <p className="text-xs tracking-wide text-crest">Best rite · {best}</p>}
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onPlay} disabled={!ready}>
            {ready ? "Defend the shrine" : "Gathering spirits…"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function TopHud({
  onPause,
  onMute,
  onWave,
}: {
  onPause: () => void;
  onMute: () => void;
  onWave: () => void;
}) {
  const gold = useHud((s) => s.gold);
  const lives = useHud((s) => s.lives);
  const wave = useHud((s) => s.wave);
  const waveName = useHud((s) => s.waveName);
  const waveActive = useHud((s) => s.waveActive);
  const waveHint = useHud((s) => s.waveHint);
  const callBonus = useHud((s) => s.callBonus);
  const muted = useHud((s) => s.muted);
  const paused = useHud((s) => s.paused);
  const won = useHud((s) => s.won);
  const lost = useHud((s) => s.lost);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto min-w-0 rounded-lg border border-border bg-ink/80 px-3 py-2 backdrop-blur-sm">
        <p className="truncate font-display text-sm tracking-tight sm:text-base">
          Wave {Math.min(wave || 1, 10)}
          <span className="ml-2 text-paper-muted">/ 10</span>
        </p>
        <p className="hidden text-xs text-paper-subtle sm:block">{waveHint || waveName}</p>
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
      <Stat label="Lives" value={lives} warn={lives <= 4} />
      <Stat label="Tribute" value={gold} />
      <div className="flex items-center gap-1 rounded-lg border border-border bg-ink/80 p-1 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="size-11" onClick={onMute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </Button>
        <Button variant="ghost" size="icon" className="size-11" onClick={onPause} aria-label="Pause">
          {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
        </Button>
        <Button size="sm" className="min-w-16 px-3" disabled={waveActive || won || lost} onClick={onWave}>
          {waveActive ? "Live" : callBonus > 0 ? `Call +${callBonus}` : "Call"}
        </Button>
      </div>
      </div>
    </header>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-ink/80 px-2.5 py-1.5 text-right backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wider text-paper-subtle">{label}</p>
      <p className={cn("font-medium tabular-nums", warn ? "text-danger" : "text-paper")}>{value}</p>
    </div>
  );
}

function BottomBar({ onSelect }: { onSelect: (k: TowerKind) => void }) {
  const gold = useHud((s) => s.gold);
  const selectedKind = useHud((s) => s.selectedKind);

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2 pb-2 sm:px-4 sm:pb-3">
      <div className="pointer-events-auto mx-auto flex max-w-4xl gap-2 overflow-x-auto rounded-lg border border-border bg-ink/80 p-1.5 backdrop-blur-sm">
        {TOWER_ORDER.map((id, i) => {
          const def = TOWERS[id];
          const can = gold >= def.cost;
          const active = selectedKind === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "flex min-w-[120px] flex-1 items-center gap-2 rounded-md border px-2 py-1 text-left transition-colors",
                active ? "border-sakura bg-ink-soft" : "border-border bg-ink",
                !can && "opacity-50",
              )}
            >
              <TowerGlyph kind={id} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {i + 1} {def.name}
                </p>
                <p className="text-xs tabular-nums text-crest">{def.cost}</p>
              </div>
            </button>
          );
        })}
      </div>
    </footer>
  );
}

function CanvasChrome({
  onUpgrade,
  onSell,
  onTarget,
}: {
  onUpgrade: () => void;
  onSell: () => void;
  onTarget: (t: Targeting) => void;
}) {
  const selectedKind = useHud((s) => s.selectedKind);
  const selectedKindPlaced = useHud((s) => s.selectedKindPlaced);
  const selectedLevel = useHud((s) => s.selectedLevel);
  const selectedSpent = useHud((s) => s.selectedSpent);
  const selectedRankName = useHud((s) => s.selectedRankName);
  const selectedPerk = useHud((s) => s.selectedPerk);
  const nextRankName = useHud((s) => s.nextRankName);
  const nextPerk = useHud((s) => s.nextPerk);
  const upgradeCost = useHud((s) => s.upgradeCost);
  const gold = useHud((s) => s.gold);
  const targeting = useHud((s) => s.targeting);

  return (
    <>
      {selectedKind && !selectedKindPlaced && (
        <div className="pointer-events-none absolute inset-x-2 bottom-24 z-[5] rounded-lg border border-border bg-ink/90 px-3 py-2 sm:inset-x-auto sm:left-3 sm:w-auto">
          <p className="text-xs text-paper-subtle">Tap a pale pad to plant {TOWERS[selectedKind].name}.</p>
        </div>
      )}
      {selectedKindPlaced && (
        <div className="absolute inset-x-2 bottom-24 z-[5] max-h-[40%] overflow-y-auto sm:inset-x-auto sm:right-3 sm:left-auto sm:w-[min(380px,calc(100%-1.5rem))]">
          <InspectPanel
            kind={selectedKindPlaced}
            level={selectedLevel}
            spent={selectedSpent}
            gold={gold}
            rankName={selectedRankName}
            perk={selectedPerk}
            nextName={nextRankName}
            nextPerk={nextPerk}
            upgradeCost={upgradeCost}
            targeting={targeting}
            onUpgrade={onUpgrade}
            onSell={onSell}
            onTarget={onTarget}
          />
        </div>
      )}
    </>
  );
}

function PerkTags({ rank }: { rank: RankStats }) {
  const tags = rankTags(rank);
  if (!tags.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-crest"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function StatDelta({ label, now, next }: { label: string; now: number; next: number | null }) {
  const bump = next != null && next !== now;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, ""));
  return (
    <p className="text-xs tabular-nums">
      <span className="mr-1 text-paper-subtle">{label}</span>
      {fmt(now)}
      {bump && <span className="text-crest"> → {fmt(next)}</span>}
    </p>
  );
}

function InspectPanel({
  kind,
  level,
  spent,
  gold,
  rankName,
  perk,
  nextName,
  nextPerk,
  upgradeCost,
  targeting,
  onUpgrade,
  onSell,
  onTarget,
}: {
  kind: TowerKind;
  level: number;
  spent: number;
  gold: number;
  rankName: string;
  perk: string;
  nextName: string;
  nextPerk: string;
  upgradeCost: number;
  targeting: Targeting;
  onUpgrade: () => void;
  onSell: () => void;
  onTarget: (t: Targeting) => void;
}) {
  const cur = rankOf(kind, level);
  const nxt = nextRank(kind, level);
  return (
    <div className="rounded-lg border border-border bg-ink/95 px-3 py-2">
      <div className="flex items-center gap-3">
        <TowerGlyph kind={kind} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {rankName}
            <span className="ml-2 text-xs text-sakura">{ROMAN[level - 1]}</span>
          </p>
          <PerkTags rank={cur} />
        </div>
        <Button size="sm" disabled={!upgradeCost || gold < upgradeCost} onClick={onUpgrade}>
          {upgradeCost ? `Consecrate · ${upgradeCost}` : "Max"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSell}>
          Sell {Math.floor(spent * SELL_RATE)}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4">
        <StatDelta label="Dmg" now={cur.damage} next={nxt?.damage ?? null} />
        <StatDelta label="Range" now={cur.range} next={nxt?.range ?? null} />
        <StatDelta label="Rate" now={cur.fireRate} next={nxt?.fireRate ?? null} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span className="mr-1 text-xs text-paper-subtle">Aim</span>
        {(["first", "last", "strong", "close"] as Targeting[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTarget(t)}
            className={cn(
              "h-9 min-w-11 rounded-sm px-2 text-xs uppercase tracking-wide",
              targeting === t ? "bg-paper text-ink" : "text-paper-subtle hover:text-paper",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {nxt && <p className="sr-only">{nextPerk}</p>}
    </div>
  );
}

function PauseWinLose({
  onResume,
  onMenu,
  onRetry,
  onLedger,
}: {
  onResume: () => void;
  onMenu: () => void;
  onRetry: () => void;
  onLedger: () => void;
}) {
  const paused = useHud((s) => s.paused);
  const won = useHud((s) => s.won);
  const lost = useHud((s) => s.lost);
  const score = useHud((s) => s.score);
  const best = useHud((s) => s.best);
  const kills = useHud((s) => s.kills);
  if (!paused && !won && !lost) return null;

  const title = won ? "The shrine holds" : lost ? "The torii fell" : "Rite paused";
  const copy = won
    ? "Dawn on quiet stone. The painted garden holds."
    : lost
      ? "Yokai reached the gate. Light the lanterns and walk the sandō again."
      : "The dusk garden waits.";

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-xl border border-border bg-ink-elevated p-6">
        <h2 className="font-display text-2xl tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-paper-muted">{copy}</p>
        {(won || lost) && (
          <p className="mt-3 text-sm tabular-nums text-crest">
            Score {score} · Best {best} · {kills} felled
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          {paused && !won && !lost && <Button onClick={onResume}>Resume</Button>}
          {(won || lost) && <Button onClick={onRetry}>Play again</Button>}
          {paused && !won && !lost && (
            <Button variant="outline" onClick={onLedger}>
              Ledger
            </Button>
          )}
          <Button variant="outline" onClick={onMenu}>
            Title
          </Button>
        </div>
      </div>
    </div>
  );
}
