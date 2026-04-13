import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {
    type AddModulesRequest,
    type BombConfig,
    type BombEntity,
    type CreateBombRequest,
    type ModuleEntity,
    ModuleType,
    type RoundEntity,
    type RoundSummary,

} from "../types";
import {api, debugModuleSync, withErrorWrapping} from "../lib/api";
import {useCatalogStore} from "./useCatalogStore";

type RoundStoreState = {
    round?: RoundEntity;
    allRounds?: RoundSummary[];
    currentBomb?: BombEntity;
    moduleNumbers: Record<string, number>;
    currentModule?: ModuleEntity & {
        bomb: BombEntity;
        moduleType: ModuleType;
    };
    manualUrl?: string;
    loading: boolean;
    error?: string;
    /** Module ID currently being opened (enter + fetch in progress); used to show loading and prevent double-clicks. */
    openingModuleId?: string | null;
};

type RoundStoreActions = {
    createRound: () => Promise<RoundEntity>;
    fetchRound: (roundId: string) => Promise<RoundEntity>;
    refreshRound: (roundId: string) => Promise<RoundEntity>;
    fetchAllRounds: () => Promise<RoundSummary[]>;
    deleteRound: (roundId: string) => Promise<void>;
    addBomb: (payload: CreateBombRequest) => Promise<BombEntity>;
    deleteBomb: (bombId: string) => Promise<void>;
    configureBomb: (
        bombId: string,
        payload: BombConfig,
    ) => Promise<BombEntity>;
    addModules: (
        bombId: string,
        payload: AddModulesRequest,
    ) => Promise<ModuleEntity[]>;
    startRound: () => Promise<RoundEntity>;
    selectBomb: (bombId: string) => void;
    selectModule: (bombId: string, moduleType: ModuleType) => void;
    selectModuleById: (bombId: string, moduleId: string) => void;
    clearModule: () => void;
    setManualUrl: (url: string) => void;
    getModuleNumber: (moduleId?: string) => number;
    setModuleNumber: (moduleId: string, number: number) => void;
    markModuleSolved: (bombId: string, moduleId: string) => void;
    /** Update a module's state and solution in the round (and currentModule if selected) so returning to the module shows the solution. */
    updateModuleAfterSolve: (
        bombId: string,
        moduleId: string,
        state: object,
        solution: object,
        solved?: boolean
    ) => void;
    addStrike: (bombId: string) => Promise<BombEntity>;
};

const attachManualUrl = (moduleType: ModuleType): string | undefined => {
    const { catalog } = useCatalogStore.getState();
    const item = catalog.find((m) => m.type === moduleType);
    if (!item) {
        console.warn(`No catalog entry found for module type: ${moduleType}`);
        return undefined;
    }
    return `https://ktane.timwi.de/HTML/${item.name.replaceAll(" ", "%20")}.html`;
};

export const useRoundStore = create<RoundStoreState & RoundStoreActions>()(
    devtools(
        (set, get) => ({
            round: undefined,
            allRounds: undefined,
            currentBomb: undefined,
            moduleNumbers: {},
            currentModule: undefined,
            manualUrl: undefined,
            loading: false,
            error: undefined,
            openingModuleId: undefined,

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
                    debugModuleSync("createRound:error", {error});
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            fetchRound: async (roundId: string) => {
                debugModuleSync("fetchRound:start", {roundId});
                set({loading: true, error: undefined});
                try {
                    const round = await withErrorWrapping(async () => {
                        const {data} = await api.get<RoundEntity>(`/rounds/${roundId}`);
                        return data;
                    });
                    debugModuleSync("fetchRound:success", {
                        roundId,
                        bombs: round.bombs.length,
                        modulesTotal: round.bombs.reduce((acc, b) => acc + b.modules.length, 0),
                    });
                    set({round, loading: false, currentBomb: undefined, currentModule: undefined, manualUrl: undefined});
                    return round;
                } catch (error) {
                    debugModuleSync("fetchRound:error", {roundId, error});
                    set({
                        loading: false,
                        error: error instanceof Error ? error.message : "Unknown error",
                    });
                    throw error;
                }
            },

            refreshRound: async (roundId: string) => {
                const prevBombId = get().currentBomb?.id;
                const prevModuleId = get().currentModule?.id;
                const prevModuleType = get().currentModule?.moduleType;

                debugModuleSync("refreshRound:start", {
                    roundId,
                    prevBombId,
                    prevModuleId,
                    prevModuleType,
                });

                set({loading: true, error: undefined});
                try {
                    const round = await withErrorWrapping(async () => {
                        const {data} = await api.get<RoundEntity>(`/rounds/${roundId}`);
                        return data;
                    });

                    debugModuleSync("refreshRound:fetched", {
                        roundId,
                        bombs: round.bombs.length,
                        modulesTotal: round.bombs.reduce((acc, b) => acc + b.modules.length, 0),
                    });

                    let nextBomb = prevBombId
                        ? round.bombs.find((b) => b.id === prevBombId)
                        : undefined;

                    let nextModule:
                        | (ModuleEntity & { bomb: BombEntity; moduleType: ModuleType })
                        | undefined;

                    if (nextBomb && prevModuleId) {
                        const module = nextBomb.modules.find((m) => m.id === prevModuleId);
                        if (module) {
                            const moduleType = module.type as ModuleType;
                            nextModule = { ...module, bomb: nextBomb, moduleType };
                        }
                    }

                    // Preserve a module selection made while this refresh was in flight
                    if (!prevModuleId) {
                        const currentNow = get().currentModule;
                        if (currentNow) {
                            const bombInRound = round.bombs.find((b) => b.id === currentNow.bomb?.id);
                            const moduleInBomb = bombInRound?.modules.find((m) => m.id === currentNow.id);
                            if (bombInRound && moduleInBomb) {
                                const moduleType = moduleInBomb.type as ModuleType;
                                nextModule = { ...moduleInBomb, bomb: bombInRound, moduleType };
                                nextBomb = bombInRound;
                            }
                        }
                    }

                    debugModuleSync("refreshRound:reselect", {
                        roundId,
                        nextBombId: nextBomb?.id,
                        nextModuleId: nextModule?.id,
                        nextModuleType: nextModule?.moduleType,
                        nextModuleSolved: (nextModule as { solved?: boolean } | undefined)?.solved,
                        hasState: Boolean((nextModule as { state?: unknown } | undefined)?.state),
                        hasSolution:
                            (nextModule as { solution?: unknown } | undefined)?.solution !== undefined,
                    });

                    const nextManualUrl = nextModule
                        ? attachManualUrl(nextModule.moduleType)
                        : prevModuleType
                          ? attachManualUrl(prevModuleType)
                          : undefined;

                    set({
                        round,
                        loading: false,
                        currentBomb: nextBomb,
                        currentModule: nextModule,
                        manualUrl: nextModule ? nextManualUrl : undefined,
                    });

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
                        const {data} = await api.get<RoundSummary[]>("/rounds");
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

            deleteBomb: async (bombId) => {
                set({loading: true, error: undefined});
                try {
                    await withErrorWrapping(async () => {
                        await api.delete(`/bombs/${bombId}`);
                    });
                    set((state) => {
                        if (!state.round) return {loading: false};
                        return {
                            loading: false,
                            round: {
                                ...state.round,
                                bombs: state.round.bombs.filter((b) => b.id !== bombId),
                            },
                            currentBomb:
                                state.currentBomb?.id === bombId ? undefined : state.currentBomb,
                        };
                    });
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
                debugModuleSync("selectModule", {
                    bombId,
                    moduleType,
                    moduleId: module.id,
                    solved: (module as { solved?: boolean } | undefined)?.solved,
                    hasState: Boolean((module as { state?: unknown } | undefined)?.state),
                    hasSolution: (module as { solution?: unknown } | undefined)?.solution !== undefined,
                });
                set({
                    currentModule: {...module, bomb, moduleType},
                    manualUrl: attachManualUrl(moduleType),
                });
            },

            selectModuleById: async (bombId, moduleId) => {
                const {round} = get();
                if (!round) return;
                const bomb = round.bombs.find((b) => b.id === bombId);
                if (!bomb) return;

                debugModuleSync("selectModuleById:start", {bombId, moduleId});
                set({openingModuleId: moduleId, error: undefined});

                let module: ModuleEntity;
                try {
                    module = await withErrorWrapping(async () => {
                        const {data} = await api.get<ModuleEntity>(
                            `/bombs/${bombId}/modules/${moduleId}`
                        );
                        return data;
                    });
                } catch (error) {
                    debugModuleSync("selectModuleById:error", {bombId, moduleId, error});
                    set({
                        openingModuleId: null,
                        error: "Failed to open module. Please try again.",
                    });
                    return;
                }

                const moduleType = module.type as ModuleType;

                debugModuleSync("selectModuleById:set", {
                    bombId,
                    moduleId: module.id,
                    moduleType,
                    solved: (module as { solved?: boolean } | undefined)?.solved,
                    hasState: Boolean((module as { state?: unknown } | undefined)?.state),
                    hasSolution: (module as { solution?: unknown } | undefined)?.solution !== undefined,
                });

                const updatedBomb: BombEntity = {
                    ...bomb,
                    modules: bomb.modules.map((m) => (m.id === moduleId ? module : m)),
                };
                const roundHasModule = round.bombs.some((b) => b.id === bombId && b.modules.some((m) => m.id === moduleId));
                const nextRound = roundHasModule
                    ? {
                          ...round,
                          bombs: round.bombs.map((b) => (b.id === bombId ? updatedBomb : b)),
                      }
                    : round;

                set((state) => ({
                    ...state,
                    round: nextRound,
                    currentBomb: state.currentBomb?.id === bombId ? updatedBomb : state.currentBomb,
                    currentModule: {...module, bomb: updatedBomb, moduleType},
                    manualUrl: attachManualUrl(moduleType),
                    openingModuleId: null,
                }));
            },

            clearModule: () => {
                set({currentModule: undefined, manualUrl: undefined});
            },

            setManualUrl: (url) => set({manualUrl: url}),

            getModuleNumber: (moduleId) => {
                if (!moduleId) return 1;
                return get().moduleNumbers[moduleId] ?? 1;
            },

            setModuleNumber: (moduleId, number) => {
                set((state) => ({
                    moduleNumbers: {
                        ...state.moduleNumbers,
                        [moduleId]: Math.min(99, Math.max(1, number)),
                    },
                }));
            },

            markModuleSolved: (bombId, moduleId) => {
                set((state) => {
                    if (!state.round) return state;
                    const isCurrentModule =
                        state.currentModule?.id === moduleId && state.currentBomb?.id === bombId;
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
                        currentModule: isCurrentModule && state.currentModule
                            ? {...state.currentModule, solved: true}
                            : state.currentModule,
                    };
                });
            },

            updateModuleAfterSolve: (bombId, moduleId, state, solution, solved) => {
                set((prev) => {
                    if (!prev.round) return prev;
                    const isCurrentModule =
                        prev.currentModule?.id === moduleId && prev.currentBomb?.id === bombId;
                    const merge = (m: ModuleEntity) =>
                        m.id !== moduleId
                            ? m
                            : {
                                  ...m,
                                  state: {...m.state, ...state},
                                  solution: {...m.solution, ...solution},
                                  ...(solved !== undefined && {solved}),
                              };
                    return {
                        round: {
                            ...prev.round,
                            bombs: prev.round.bombs.map((b) =>
                                b.id !== bombId ? b : {...b, modules: b.modules.map(merge)},
                            ),
                        },
                        currentBomb:
                            prev.currentBomb?.id === bombId
                                ? {...prev.currentBomb, modules: prev.currentBomb.modules.map(merge)}
                                : prev.currentBomb,
                        currentModule:
                            isCurrentModule && prev.currentModule
                                ? {
                                      ...prev.currentModule,
                                      state: {...prev.currentModule.state, ...state},
                                      solution: {...prev.currentModule.solution, ...solution},
                                      ...(solved !== undefined && {solved}),
                                  }
                                : prev.currentModule,
                    };
                });
            },

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
