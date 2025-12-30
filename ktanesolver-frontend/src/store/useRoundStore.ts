import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {
    type AddModulesRequest,
    type BombEntity,
    type CreateBombRequest,
    type ModuleEntity,
    ModuleType,
    type RoundEntity,

} from "../types";
import {api, withErrorWrapping} from "../lib/api";

type RoundStoreState = {
    round?: RoundEntity;
    allRounds?: RoundEntity[];
    currentBomb?: BombEntity;
    currentModule?: {
        id: string;
        bomb: BombEntity;
        moduleType: ModuleType;
    };
    manualUrl?: string;
    loading: boolean;
    error?: string;
    moduleNumber: number;
};

type RoundStoreActions = {
    createRound: () => Promise<RoundEntity>;
    fetchRound: (roundId: string) => Promise<RoundEntity>;
    fetchAllRounds: () => Promise<RoundEntity[]>;
    deleteRound: (roundId: string) => Promise<void>;
    addBomb: (payload: CreateBombRequest) => Promise<BombEntity>;
    configureBomb: (
        bombId: string,
        payload: Partial<CreateBombRequest>,
    ) => Promise<BombEntity>;
    addModules: (
        bombId: string,
        payload: AddModulesRequest,
    ) => Promise<ModuleEntity[]>;
    startRound: () => Promise<RoundEntity>;
    selectBomb: (bombId: string) => void;
    selectModule: (bombId: string, moduleType: ModuleType) => void;
    clearModule: () => void;
    setManualUrl: (url: string) => void;
    markModuleSolved: (bombId: string, moduleId: string) => void;
    setModuleNumber: (number: number) => void;
    addStrike: (bombId: string) => Promise<BombEntity>;
};

const moduleManualNames: Record<ModuleType, string> = {
    [ModuleType.WIRES]: "Wires",
    [ModuleType.BUTTON]: "The Button",
    [ModuleType.KEYPADS]: "Keypad",
    [ModuleType.MEMORY]: "Memory",
    [ModuleType.SIMON_SAYS]: "Simon Says",
    [ModuleType.MORSE_CODE]: "Morse Code",
    [ModuleType.FORGET_ME_NOT]: "Forget Me Not",
    [ModuleType.WHOS_ON_FIRST]: "Who's on First",
    [ModuleType.VENTING_GAS]: "Venting Gas",
    [ModuleType.CAPACITOR_DISCHARGE]: "Capacitor Discharge",
    [ModuleType.COMPLICATED_WIRES]: "Complicated Wires",
    [ModuleType.WIRE_SEQUENCES]: "Wire Sequence",
    [ModuleType.PASSWORDS]: "Password",
    [ModuleType.MAZES]: "Maze",
    [ModuleType.KNOBS]: "Knobs",
    [ModuleType.COLOR_FLASH]: "Colour Flash",
};

const attachManualUrl = (moduleType: ModuleType) =>
    `https://ktane.timwi.de/html/${moduleManualNames[moduleType].replaceAll(" ", "%20")}.html`;

export const useRoundStore = create<RoundStoreState & RoundStoreActions>()(
    devtools(
        (set, get) => ({
            round: undefined,
            allRounds: undefined,
            currentBomb: undefined,
            currentModule: undefined,
            manualUrl: undefined,
            loading: false,
            error: undefined,
            moduleNumber: 1,

            createRound: async () => {
                set({loading: true, error: undefined});
                try {
                    const round = await withErrorWrapping(async () => {
                        const {data} = await api.post<RoundEntity>("/rounds");
                        return data;
                    });
                    set({round, loading: false, currentBomb: undefined, currentModule: undefined, manualUrl: undefined});
                    return round;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            fetchRound: async (roundId: string) => {
                set({loading: true, error: undefined});
                try {
                    const round = await withErrorWrapping(async () => {
                        const {data} = await api.get<RoundEntity>(`/rounds/${roundId}`);
                        return data;
                    });
                    set({round, loading: false, currentBomb: undefined, currentModule: undefined, manualUrl: undefined});
                    return round;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            fetchAllRounds: async () => {
                set({loading: true, error: undefined});
                try {
                    const rounds = await withErrorWrapping(async () => {
                        const {data} = await api.get<RoundEntity[]>("/rounds");
                        return data;
                    });
                    set({allRounds: rounds, loading: false});
                    return rounds;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            deleteRound: async (roundId: string) => {
                set({loading: true, error: undefined});
                try {
                    await withErrorWrapping(async () => {
                        await api.delete(`/rounds/${roundId}`);
                    });
                    set((state) => ({
                        ...state,
                        loading: false,
                        allRounds: state.allRounds?.filter((r) => r.id !== roundId),
                    }));
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            addBomb: async (payload) => {
                const {round} = get();
                if (!round?.id) {
                    throw new Error("Round not initialized");
                }
                set({loading: true, error: undefined});
                try {
                    const bomb = await withErrorWrapping(async () => {
                        const {data} = await api.post<BombEntity>(
                            `/rounds/${round.id}/bombs`,
                            payload,
                        );
                        return data;
                    });
                    set((state) => {
                        if (!state.round) {
                            return {loading: false};
                        }
                        return {
                            loading: false,
                            round: {...state.round, bombs: [...state.round.bombs, bomb]},
                            currentBomb: bomb,
                        };
                    });
                    return bomb;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            configureBomb: async (bombId, payload) => {
                set({loading: true, error: undefined});
                try {
                    const updated = await withErrorWrapping(async () => {
                        const {data} = await api.put<BombEntity>(
                            `/bombs/${bombId}/config`,
                            payload,
                        );
                        return data;
                    });

                    set((state) => {
                        if (!state.round) {
                            return {loading: false};
                        }
                        return {
                            loading: false,
                            round: {
                                ...state.round,
                                bombs: state.round.bombs.map((b) =>
                                    b.id === bombId ? updated : b,
                                ),
                            },
                            currentBomb:
                                state.currentBomb?.id === bombId ? updated : state.currentBomb,
                        };
                    });
                    return updated;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            addModules: async (bombId, payload) => {
                set({loading: true, error: undefined});
                try {
                    const modules = await withErrorWrapping(async () => {
                        const {data} = await api.post<ModuleEntity[]>(
                            `/bombs/${bombId}/modules`,
                            payload,
                        );
                        return data;
                    });
                    set((state) => {
                        if (!state.round) {
                            return {loading: false};
                        }
                        const bomb = state.round.bombs.find((b) => b.id === bombId);
                        if (!bomb) {
                            return {loading: false};
                        }
                        const updatedBomb: BombEntity = {
                            ...bomb,
                            modules: [...bomb.modules, ...modules],
                        };
                        return {
                            loading: false,
                            round: {
                                ...state.round,
                                bombs: state.round.bombs.map((b) =>
                                    b.id === bombId ? updatedBomb : b,
                                ),
                            },
                            currentBomb:
                                state.currentBomb?.id === bombId ? updatedBomb : state.currentBomb,
                        };
                    });
                    return modules;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            startRound: async () => {
                const {round} = get();
                if (!round) {
                    throw new Error("Round not initialized");
                }
                set({loading: true, error: undefined});
                try {
                    const updated = await withErrorWrapping(async () => {
                        const {data} = await api.post<RoundEntity>(
                            `/rounds/${round.id}/start`,
                        );
                        return data;
                    });
                    set({round: updated, loading: false});
                    return updated;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            selectBomb: (bombId) => {
                const {round} = get();
                if (!round) return;
                const bomb = round.bombs.find((b) => b.id === bombId);
                set({currentBomb: bomb});
            },

            selectModule: (bombId, moduleType) => {
                const {round} = get();
                if (!round) return;
                const bomb = round.bombs.find((b) => b.id === bombId);
                if (!bomb) return;
                const module = bomb.modules.find((m) => m.type === moduleType);
                if (!module) return;
                set({
                    currentModule: {id: module.id, bomb, moduleType},
                    manualUrl: attachManualUrl(moduleType),
                });
            },

            clearModule: () => set({currentModule: undefined, manualUrl: undefined}),

            setManualUrl: (url) => set({manualUrl: url}),

            markModuleSolved: (bombId, moduleId) => {
                set((state) => {
                    if (!state.round) return state;
                    return {
                        round: {
                            ...state.round,
                            bombs: state.round.bombs.map((bomb) => {
                                if (bomb.id !== bombId) return bomb;
                                return {
                                    ...bomb,
                                    modules: bomb.modules.map((module) => {
                                        if (module.id !== moduleId) return module;
                                        return {...module, solved: true};
                                    }),
                                };
                            }),
                        },
                        currentBomb:
                            state.currentBomb?.id === bombId
                                ? {
                                      ...state.currentBomb,
                                      modules: state.currentBomb.modules.map((module) => {
                                          if (module.id !== moduleId) return module;
                                          return {...module, solved: true};
                                      }),
                                  }
                                : state.currentBomb,
                    };
                });
            },

            setModuleNumber: (number) => set({moduleNumber: Math.max(1, Math.min(99, number))}),

            addStrike: async (bombId) => {
                set({loading: true, error: undefined});
                try {
                    const updated = await withErrorWrapping(async () => {
                        const {data} = await api.post<BombEntity>(
                            `/bombs/${bombId}/strike`,
                        );
                        return data;
                    });

                    set((state) => {
                        if (!state.round) {
                            return {loading: false};
                        }
                        return {
                            loading: false,
                            round: {
                                ...state.round,
                                bombs: state.round.bombs.map((b) =>
                                    b.id === bombId ? updated : b,
                                ),
                            },
                            currentBomb:
                                state.currentBomb?.id === bombId ? updated : state.currentBomb,
                        };
                    });
                    return updated;
                } catch (error) {
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },
        }),
        {name: "round-store"},
    ),
);
