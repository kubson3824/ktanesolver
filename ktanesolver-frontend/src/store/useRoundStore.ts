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
import {api, debugModuleSync, withErrorWrapping} from "../lib/api";

type RoundStoreState = {
    round?: RoundEntity;
    allRounds?: RoundEntity[];
    currentBomb?: BombEntity;
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
    selectModuleById: (bombId: string, moduleId: string) => void;
    clearModule: () => void;
    setManualUrl: (url: string) => void;
    markModuleSolved: (bombId: string, moduleId: string) => void;
    /** Update a module's state and solution in the round (and currentModule if selected) so returning to the module shows the solution. */
    updateModuleAfterSolve: (
        bombId: string,
        moduleId: string,
        state: Record<string, unknown>,
        solution: Record<string, unknown>,
        solved?: boolean
    ) => void;
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
    [ModuleType.PIANO_KEYS]: "Piano Keys",
    [ModuleType.SEMAPHORE]: "Semaphore",
    [ModuleType.MATH]: "Math",
    [ModuleType.EMOJI_MATH]: "Emoji Math",
    [ModuleType.SWITCHES]: "Switches",
    [ModuleType.TWO_BITS]: "Two Bits",
    [ModuleType.WORD_SCRAMBLE]: "Word Scramble",
    [ModuleType.ROUND_KEYPAD]: "Round Keypad",
    [ModuleType.ANAGRAMS]: "Anagrams",
    [ModuleType.COMBINATION_LOCK]: "Combination Lock",
    [ModuleType.LISTENING]: "Listening",
    [ModuleType.FOREIGN_EXCHANGE_RATES]: "Foreign Exchange Rates",
    [ModuleType.MORSEMATICS]: "Morsematics",
    [ModuleType.CONNECTION_CHECK]: "Connection Check",
    [ModuleType.LETTER_KEYS]: "Letter Keys",
    [ModuleType.LOGIC]: "Logic",
    [ModuleType.ASTROLOGY]: "Astrology",
    [ModuleType.MYSTIC_SQUARE]: "Mystic Square",
    [ModuleType.CRAZY_TALK]: "Crazy Talk",
    [ModuleType.ADVENTURE_GAME]: "Adventure Game",
    [ModuleType.PLUMBING]: "Plumbing",
    [ModuleType.CRUEL_PIANO_KEYS]: "Cruel Piano Keys",
    [ModuleType.SAFETY_SAFE]: "Safety Safe",
    [ModuleType.CRYPTOGRAPHY]: "Cryptography",
    [ModuleType.TURN_THE_KEY]: "Turn The Key",
    [ModuleType.TURN_THE_KEYS]: "Turn The Keys",
    [ModuleType.CHESS]: "Chess",
    [ModuleType.ORIENTATION_CUBE]: "Orientation Cube",
    [ModuleType.MOUSE_IN_THE_MAZE]: "Mouse In The Maze",
    [ModuleType.THREE_D_MAZE]: "3D Maze",
};

const attachManualUrl = (moduleType: ModuleType) => {
    const moduleName = moduleManualNames[moduleType];
    if (!moduleName) {
        console.warn(`No manual name found for module type: ${moduleType}`);
        return undefined;
    }
    return `https://ktane.timwi.de/html/${moduleName.replaceAll(" ", "%20")}.html`;
};

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
                    const roundId = get().round?.id;
                    if (roundId) void get().refreshRound(roundId);
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
                    const roundIdAfterConfig = get().round?.id;
                    if (roundIdAfterConfig) void get().refreshRound(roundIdAfterConfig);
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
                    const roundIdAfterModules = get().round?.id;
                    if (roundIdAfterModules) void get().refreshRound(roundIdAfterModules);
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
