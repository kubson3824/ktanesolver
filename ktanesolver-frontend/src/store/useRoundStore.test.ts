import { afterEach, describe, expect, it, vi } from "vitest";

import { BombStatus, ModuleType, RoundStatus, type BombEntity, type ModuleEntity, type RoundEntity } from "../types";
import { api } from "../lib/api";
import { useRoundStore } from "./useRoundStore";

vi.mock("../lib/api", () => ({
  api: {
    delete: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  debugModuleSync: vi.fn(),
  withErrorWrapping: async <T>(fn: () => Promise<T>) => fn(),
}));

const createModule = (id: string, type: ModuleType): ModuleEntity => ({
  id,
  type,
  solved: false,
  version: 0,
  state: {},
  solution: {},
});

const createBomb = (modules: ModuleEntity[]): BombEntity => ({
  id: "bomb-1",
  serialNumber: "ABC123",
  aaBatteryCount: 2,
  dBatteryCount: 1,
  indicators: {},
  portPlates: [],
  status: BombStatus.ACTIVE,
  strikes: 0,
  modules,
});

describe("useRoundStore", () => {
  afterEach(() => {
    useRoundStore.setState({
      round: undefined,
      allRounds: undefined,
      currentBomb: undefined,
      currentModule: undefined,
      manualUrl: undefined,
      loading: false,
      error: undefined,
      openingModuleId: undefined,
    });
    vi.clearAllMocks();
  });

  it("removes the module from the bomb and clears the selection when deleting the active module", async () => {
    const firstModule = createModule("module-1", ModuleType.BUTTON);
    const secondModule = createModule("module-2", ModuleType.WIRES);
    const bomb = createBomb([firstModule, secondModule]);

    useRoundStore.setState({
      round: {
        id: "round-1",
        status: RoundStatus.SETUP,
        bombs: [bomb],
        roundState: {},
      },
      currentBomb: bomb,
      currentModule: {
        ...firstModule,
        bomb,
        moduleType: firstModule.type,
      },
      manualUrl: "https://example.test/manual",
    });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await useRoundStore.getState().removeModule(bomb.id, firstModule.id);

    expect(api.delete).toHaveBeenCalledWith(`/bombs/${bomb.id}/modules/${firstModule.id}`);
    expect(useRoundStore.getState().round?.bombs[0].modules).toEqual([secondModule]);
    expect(useRoundStore.getState().currentBomb?.modules).toEqual([secondModule]);
    expect(useRoundStore.getState().currentModule).toBeUndefined();
    expect(useRoundStore.getState().manualUrl).toBeUndefined();
  });

  it("resets a solved module and clears its persisted attempt", async () => {
    const module = {
      ...createModule("module-1", ModuleType.BUTTON),
      solved: true,
      state: { label: "wrong" },
      solution: { instruction: "wrong" },
    };
    const bomb = createBomb([module]);
    useRoundStore.setState({
      round: { id: "round-1", status: RoundStatus.ACTIVE, bombs: [bomb], roundState: {} },
      currentBomb: bomb,
      currentModule: { ...module, bomb, moduleType: module.type },
    });
    vi.mocked(api.post).mockResolvedValue({ data: undefined });

    await useRoundStore.getState().resetModule(bomb.id, module.id);

    expect(api.post).toHaveBeenCalledWith(`/bombs/${bomb.id}/modules/${module.id}/reset`);
    expect(useRoundStore.getState().currentModule).toMatchObject({ solved: false, state: {}, solution: {} });
    expect(useRoundStore.getState().round?.bombs[0].modules[0]).toMatchObject({ solved: false, state: {}, solution: {} });
  });

  it("does not mark a physical module solved when calculation finishes", () => {
    const module = createModule("module-1", ModuleType.FOREIGN_EXCHANGE_RATES);
    const bomb = createBomb([module]);
    const round: RoundEntity = {
      id: "round-1",
      status: RoundStatus.ACTIVE,
      bombs: [bomb],
      roundState: {},
    };
    useRoundStore.setState({
      round,
      currentBomb: bomb,
      currentModule: { ...module, bomb, moduleType: module.type },
    });
    useRoundStore.getState().markModuleSolved(bomb.id, module.id);

    expect(useRoundStore.getState().round?.bombs[0].modules[0].solved).toBe(false);
    expect(useRoundStore.getState().currentModule?.solved).toBe(false);
  });

  it("marks a module solved only through the completion endpoint", async () => {
    const module = createModule("module-1", ModuleType.BUTTON);
    const bomb = createBomb([module]);
    useRoundStore.setState({
      round: { id: "round-1", status: RoundStatus.ACTIVE, bombs: [bomb], roundState: {} },
      currentBomb: bomb,
      currentModule: { ...module, bomb, moduleType: module.type },
    });
    vi.mocked(api.post).mockResolvedValue({ data: { ...module, solved: true, version: 1 } });

    await useRoundStore.getState().completeModule(bomb.id, module.id);

    expect(api.post).toHaveBeenCalledWith(`/bombs/${bomb.id}/modules/${module.id}/complete`, { version: 0 });
    expect(useRoundStore.getState().currentModule?.solved).toBe(true);
  });
});
