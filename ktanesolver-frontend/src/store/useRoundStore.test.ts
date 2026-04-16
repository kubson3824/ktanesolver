import { afterEach, describe, expect, it, vi } from "vitest";

import { BombStatus, ModuleType, RoundStatus, type BombEntity, type ModuleEntity } from "../types";
import { api } from "../lib/api";
import { useRoundStore } from "./useRoundStore";

vi.mock("../lib/api", () => ({
  api: {
    delete: vi.fn(),
  },
  debugModuleSync: vi.fn(),
  withErrorWrapping: async <T>(fn: () => Promise<T>) => fn(),
}));

const createModule = (id: string, type: ModuleType): ModuleEntity => ({
  id,
  type,
  solved: false,
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
      moduleNumbers: {},
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
});
