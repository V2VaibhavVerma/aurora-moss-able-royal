import { create } from "zustand";
import {
  DEFAULT_PARAMS,
  type LabParams,
  type NationalModel,
  type SiteMethod,
} from "@/lib/forecast/types";

type LabState = {
  params: LabParams;
  selectedSite: string;
  patch: (p: Partial<LabParams>) => void;
  setNational: (m: NationalModel) => void;
  setMatureMethod: (m: SiteMethod) => void;
  setInterMethod: (m: SiteMethod) => void;
  toggleMature: (id: string) => void;
  setSite: (id: string) => void;
  reset: () => void;
  applyPreset: (name: PresetName) => void;
};

export type PresetName = "notebook" | "consecutive" | "includeFeb" | "trendChaser";

const PRESETS: Record<PresetName, Partial<LabParams>> = {
  notebook: { ...DEFAULT_PARAMS },
  consecutive: {
    origin: "2026-01-01",
    skipMonths: 0,
    horizon: 3,
    nationalModel: "mean",
    meanWindow: 12,
  },
  includeFeb: {
    origin: "2026-02-01",
    skipMonths: 0,
    horizon: 3,
    nationalModel: "mean",
    meanWindow: 12,
  },
  trendChaser: {
    origin: "2026-01-01",
    skipMonths: 1,
    horizon: 3,
    nationalModel: "hw",
    hwTrend: true,
    hwSeasonal: true,
    hwDamped: false,
    hwAuto: true,
  },
};

export const useLab = create<LabState>()((set) => ({
  params: { ...DEFAULT_PARAMS },
  selectedSite: "ID10",
  patch: (p) => set((s) => ({ params: { ...s.params, ...p } })),
  setNational: (m) => set((s) => ({ params: { ...s.params, nationalModel: m } })),
  setMatureMethod: (m) => set((s) => ({ params: { ...s.params, matureMethod: m } })),
  setInterMethod: (m) => set((s) => ({ params: { ...s.params, interMethod: m } })),
  setSite: (id) => set({ selectedSite: id }),
  toggleMature: (id) =>
    set((s) => {
      const isM = s.params.matureIds.includes(id);
      const matureIds = isM
        ? s.params.matureIds.filter((x) => x !== id)
        : [...s.params.matureIds, id];
      const interIds = isM
        ? [...s.params.interIds, id]
        : s.params.interIds.filter((x) => x !== id);
      return { params: { ...s.params, matureIds, interIds } };
    }),
  reset: () => set({ params: { ...DEFAULT_PARAMS } }),
  applyPreset: (name) => set({ params: { ...DEFAULT_PARAMS, ...PRESETS[name] } }),
}));
