import { create } from "zustand";
import type {Round} from "../types/round";
import { api } from "../api/client";

interface RoundState {
    round: Round | null;
    activeBombId: string | null;
    activeModuleId: string | null;

    loadRound: (roundId: string) => Promise<void>;
    setActiveBomb: (bombId: string) => void;
    setActiveModule: (moduleId: string) => void;
}

export const useRoundStore = create<RoundState>((set) => ({
    round: null,
    activeBombId: null,
    activeModuleId: null,

    async loadRound(roundId) {
        const res = await api.get(`/rounds/${roundId}`);
        set({ round: res.data });
    },

    setActiveBomb(bombId) {
        set({ activeBombId: bombId, activeModuleId: null });
    },

    setActiveModule(moduleId) {
        set({ activeModuleId: moduleId });
    },
}));
