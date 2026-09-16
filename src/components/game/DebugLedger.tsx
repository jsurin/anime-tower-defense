import { ScrollText } from "lucide-react";
import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { debugSnapshot, SPAWN_KINDS } from "@/game/debug";
import { SPRITE_TECHS, sdfBlurb } from "@/game/sprite3d";
import { ENEMIES, WAVES, isBuildableCell } from "@/game/config";
import {
  debugFillLives,
  debugJumpWave,
  debugKillLiving,
  debugMaxRank,
  debugSkipWave,
  spawnEnemy,
  type SimEvents,
} from "@/game/sim";
import type { DebugState, GameSim } from "@/game/types";
import { cn } from "@/lib/utils";

const OVERLAYS: { key: keyof Pick<DebugState, "path" | "pads" | "ranges" | "hits" | "labels">; label: string }[] = [
  { key: "path", label: "Road" },
  { key: "pads", label: "Pads" },
  { key: "ranges", label: "Range" },
  { key: "hits", label: "Hits" },
  { key: "labels", label: "Names" },
];

const SPEEDS = [0.25, 1, 2, 4];

type Props = {
  open: boolean;
  simRef: RefObject<GameSim | null>;
  pausedRef: RefObject<boolean>;
  onClose: () => void;
  onSync: () => void;
  playSfx: (ev: SimEvents[number]) => void;
};

export function DebugLedger({ open, simRef, pausedRef, onClose, onSync, playSfx }: Props) {
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 120);
    return () => window.clearInterval(id);
  }, [open]);

  const sim = simRef.current;
  if (!open || !sim) return null;

  const run = (fn: (events: SimEvents) => void) => {
    const events: SimEvents = [];
    fn(events);
    for (const ev of events) playSfx(ev);
    onSync();
    setTick((n) => n + 1);
  };

  const toggle = (key: keyof DebugState) => {
    const d = sim.debug as unknown as Record<string, unknown>;
    d[key as string] = !d[key as string];
    onSync();
    setTick((n) => n + 1);
  };

  const living = sim.enemies.filter((e) => e.alive).length;
  const shots = sim.projectiles.filter((p) => p.alive).length;
  const hover =
    sim.hoverCol >= 0
      ? `${sim.hoverCol},${sim.hoverRow}${isBuildableCell(sim.hoverCol, sim.hoverRow) ? " pad" : ""}`
      : "—";
  void tick;

  return (
    <aside className="absolute top-2 right-2 z-20 flex max-h-[calc(100%-1rem)] w-[min(280px,calc(100%-1rem))] max-w-full flex-col overflow-hidden rounded-lg border border-border bg-ink/95">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <ScrollText className="size-4 text-sakura" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Ledger</p>
          <p className="text-[11px] text-paper-subtle">` to close · inspect the rite</p>
        </div>
        <Button variant="ghost" size="sm" className="h-9 px-2" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Meters</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs tabular-nums">
            <p>
              <span className="text-paper-subtle">FPS </span>
              {sim.debug.fps}
            </p>
            <p>
              <span className="text-paper-subtle">dt </span>
              {sim.debug.frameDt.toFixed(3)}
            </p>
            <p>
              <span className="text-paper-subtle">Yokai </span>
              {living}
              <span className="text-paper-subtle"> +{sim.spawnQueue.length}</span>
            </p>
            <p>
              <span className="text-paper-subtle">Shots </span>
              {shots}
            </p>
            <p>
              <span className="text-paper-subtle">Dmg </span>
              {Math.round(sim.debug.dmg)}
            </p>
            <p>
              <span className="text-paper-subtle">Gold in </span>
              {sim.debug.goldIn}
            </p>
            <p>
              <span className="text-paper-subtle">Fires </span>
              {sim.debug.shots}
            </p>
            <p>
              <span className="text-paper-subtle">Leaks </span>
              {sim.leaks}
            </p>
            <p className="col-span-2">
              <span className="text-paper-subtle">Cell </span>
              {hover}
            </p>
          </div>
        </section>

        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Sprites · V</p>
          <div className="flex flex-wrap gap-1">
            {SPRITE_TECHS.map((t) => (
              <Chip
                key={t.id}
                on={(sim.debug.spriteTech ?? "flat") === t.id}
                onClick={() => {
                  sim.debug.spriteTech = t.id;
                  onSync();
                  setTick((n) => n + 1);
                }}
              >
                {t.label}
              </Chip>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-paper-subtle">{sdfBlurb(sim.debug.spriteTech)}</p>
        </section>

        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Overlays</p>
          <div className="flex flex-wrap gap-1">
            {OVERLAYS.map((o) => (
              <Chip key={o.key} on={sim.debug[o.key]} onClick={() => toggle(o.key)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Rites</p>
          <div className="flex flex-wrap gap-1">
            <Chip on={sim.debug.god} onClick={() => toggle("god")}>
              God
            </Chip>
            <Chip on={sim.debug.vault} onClick={() => toggle("vault")}>
              Vault
            </Chip>
            <Chip on={sim.debug.freeze} onClick={() => toggle("freeze")}>
              Freeze
            </Chip>
            <Chip
              on={false}
              onClick={() => {
                sim.gold += 100;
                onSync();
                setTick((n) => n + 1);
              }}
            >
              +100
            </Chip>
            <Chip
              on={false}
              onClick={() => {
                sim.gold += 500;
                onSync();
                setTick((n) => n + 1);
              }}
            >
              +500
            </Chip>
            <Chip on={false} onClick={() => run(() => debugFillLives(sim))}>
              Lives
            </Chip>
            <Chip on={false} onClick={() => run(() => debugKillLiving(sim))}>
              Kill
            </Chip>
            <Chip on={false} onClick={() => run((ev) => debugSkipWave(sim, ev))}>
              Skip wave
            </Chip>
            <Chip on={false} onClick={() => run((ev) => debugMaxRank(sim, ev))}>
              Max rank
            </Chip>
            <Chip
              on={pausedRef.current}
              onClick={() => {
                sim.debug.step = true;
                setTick((n) => n + 1);
              }}
            >
              Step
            </Chip>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {SPEEDS.map((s) => (
              <Chip
                key={s}
                on={sim.speed === s}
                onClick={() => {
                  sim.speed = s;
                  onSync();
                  setTick((n) => n + 1);
                }}
              >
                {s}×
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Call yokai</p>
          <div className="flex flex-wrap gap-1">
            {SPAWN_KINDS.map((kind) => (
              <Chip key={kind} on={false} onClick={() => run(() => void spawnEnemy(sim, kind))}>
                {ENEMIES[kind].name.replace("Oni ", "")}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-1.5 text-[10px] uppercase tracking-wider text-paper-subtle">Wave</p>
          <div className="flex flex-wrap gap-1">
            {WAVES.map((w) => (
              <Chip key={w.id} on={sim.wave === w.id} onClick={() => run((ev) => debugJumpWave(sim, w.id, ev))}>
                {w.id}
              </Chip>
            ))}
          </div>
        </section>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={async () => {
            const text = JSON.stringify(debugSnapshot(sim), null, 2);
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied snapshot" : "Copy snapshot"}
        </Button>
      </div>
    </aside>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 min-w-11 rounded-sm px-2 text-[11px] uppercase tracking-wide",
        on ? "bg-paper text-ink" : "bg-ink-soft text-paper-subtle hover:text-paper",
      )}
    >
      {children}
    </button>
  );
}
