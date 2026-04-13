import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ModuleSelector from "./ModuleSelector";
import { useCatalogStore } from "../store/useCatalogStore";
import { ModuleCategory, type ModuleCatalogItem } from "../types";

const catalog: ModuleCatalogItem[] = [
  {
    id: "alpha",
    name: "Alpha",
    category: ModuleCategory.VANILLA_REGULAR,
    type: "ALPHA",
    tags: ["test"],
    description: "Alpha module",
    hasInput: true,
    hasOutput: true,
    checkFirst: false,
  },
  {
    id: "beta",
    name: "Beta",
    category: ModuleCategory.VANILLA_REGULAR,
    type: "BETA",
    tags: ["test"],
    description: "Beta module",
    hasInput: true,
    hasOutput: true,
    checkFirst: false,
  },
  {
    id: "gamma",
    name: "Gamma",
    category: ModuleCategory.VANILLA_REGULAR,
    type: "GAMMA",
    tags: ["test"],
    description: "Gamma module",
    hasInput: true,
    hasOutput: true,
    checkFirst: false,
  },
];

function getVisibleModuleNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("p"))
    .map((element) => element.textContent?.trim())
    .filter((text): text is string => Boolean(text));
}

describe("ModuleSelector", () => {
  afterEach(() => {
    useCatalogStore.setState({
      catalog: [],
      loaded: false,
      loading: false,
      error: undefined,
      fetchCatalog: vi.fn().mockResolvedValue(undefined),
    });
    vi.clearAllMocks();
  });

  it("keeps the visible module order after selecting a module", () => {
    useCatalogStore.setState({
      catalog,
      loaded: true,
      loading: false,
      error: undefined,
      fetchCatalog: vi.fn().mockResolvedValue(undefined),
    });

    const onSelectionChange = vi.fn();
    const { container } = render(<ModuleSelector onSelectionChange={onSelectionChange} />);

    expect(getVisibleModuleNames(container)).toEqual(["Alpha", "Beta", "Gamma"]);

    act(() => {
      fireEvent.click(screen.getByText("Gamma"));
    });

    expect(getVisibleModuleNames(container)).toEqual(["Alpha", "Beta", "Gamma"]);
  });
});
