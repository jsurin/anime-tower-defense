import { create } from "zustand";
import { START_GOLD, START_LIVES } from "./config";
import type { Targeting, TowerKind } from "./types";

export type HudState = {
  gold: number;
  lives: number;
  wave: number;
  waveName: string;
  waveActive: boolean;
  waveHint: string;
  prep: number;
  callBonus: number;
  speed: number;
  targeting: Targeting;
  selectedKind: TowerKind | null;
  selectedLevel: number;
  selectedSpent: number;
  selectedKindPlaced: TowerKind | null;
  selectedRankName: string;
  selectedPerk: string;
  nextRankName: string;
  nextPerk: string;
  upgradeCost: number;
  remaining: number;
  muted: boolean;
  paused: boolean;
  won: boolean;
  lost: boolean;
  kills: number;
  score: number;
  best: number;
};

const initial: Omit<HudState, never> = {
  gold: START_GOLD,
  lives: START_LIVES,
  wave: 0,
  waveName: "Prepare",
  waveActive: false,
  waveHint: "",
  prep: 24,
  callBonus: 0,
  speed: 1,
  targeting: "first",
  selectedKind: "yumi",
  selectedLevel: 0,
  selectedSpent: 0,
  selectedKindPlaced: null,
  selectedRankName: "",
  selectedPerk: "",
  nextRankName: "",
  nextPerk: "",
  upgradeCost: 0,
  remaining: 0,
  muted: false,
  paused: false,
  won: false,
  lost: false,
  kills: 0,
  score: 0,
  best: 0,
};

export const useHud = create<HudState>(() => ({ ...initial }));

export function patchHud(partial: Partial<HudState>) {
  useHud.setState(partial);
}

export function resetHud(best: number) {
  useHud.setState({ ...initial, best, selectedKind: "yumi" });
}
