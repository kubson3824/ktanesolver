import { describe, expect, it } from "vitest";

import { ModuleCategory, ModuleType, type ModuleCatalogItem } from "../../types";
import { getLazySolver, isNeedyModuleType } from "./registry";

function createCatalogItem(
  type: string,
  category: ModuleCategory,
): ModuleCatalogItem {
  return {
    id: type.toLowerCase(),
    name: type,
    category,
    type,
    tags: [],
    description: "",
    hasInput: true,
    hasOutput: true,
    checkFirst: false,
  };
}

describe("solver registry", () => {
  it("returns a stable lazy component for repeated lookups", () => {
    const first = getLazySolver(ModuleType.WIRES);
    const second = getLazySolver(ModuleType.WIRES);

    expect(first).toBe(second);
  });

  it("registers needy placeholder solvers in the shared registry", () => {
    expect(getLazySolver(ModuleType.KNOBS)).not.toBeNull();
    expect(getLazySolver(ModuleType.VENTING_GAS)).not.toBeNull();
    expect(getLazySolver(ModuleType.CAPACITOR_DISCHARGE)).not.toBeNull();
  });

  it("uses catalog metadata when available to classify needy modules", () => {
    const catalogByType: Record<string, ModuleCatalogItem> = {
      [ModuleType.FORGET_ME_NOT]: createCatalogItem(
        ModuleType.FORGET_ME_NOT,
        ModuleCategory.MODDED_REGULAR,
      ),
    };

    expect(isNeedyModuleType(ModuleType.FORGET_ME_NOT, catalogByType)).toBe(false);
  });

  it("falls back to registry metadata when a catalog entry is unavailable", () => {
    expect(isNeedyModuleType(ModuleType.KNOBS, {})).toBe(true);
    expect(isNeedyModuleType(ModuleType.WIRES, {})).toBe(false);
  });
});
