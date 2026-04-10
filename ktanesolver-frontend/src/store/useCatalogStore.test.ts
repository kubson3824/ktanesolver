import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "../lib/api";
import { useCatalogStore } from "./useCatalogStore";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
  },
  withErrorWrapping: async <T>(fn: () => Promise<T>) => fn(),
}));

describe("useCatalogStore", () => {
  afterEach(() => {
    useCatalogStore.setState({ catalog: [], loaded: false });
    vi.clearAllMocks();
  });

  it("fetches the module catalog from the shared api endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: "wires",
          name: "Wires",
          category: "VANILLA_REGULAR",
          type: "WIRES",
          tags: ["vanilla"],
          description: "Cut the right wire",
          hasInput: true,
          hasOutput: true,
          checkFirst: false,
        },
      ],
    });

    await useCatalogStore.getState().fetchCatalog();

    expect(api.get).toHaveBeenCalledWith("/api/modules");
    expect(useCatalogStore.getState().catalog).toHaveLength(1);
    expect(useCatalogStore.getState().loaded).toBe(true);
  });
});
