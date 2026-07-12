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

  function setCatalog(items: ModuleCatalogItem[]) {
    useCatalogStore.setState({
      catalog: items,
      loaded: true,
      loading: false,
      error: undefined,
      fetchCatalog: vi.fn().mockResolvedValue(undefined),
    });
  }

  it("keeps the visible module order after selecting a module", () => {
    setCatalog(catalog);

    const onSelectionChange = vi.fn();
    const { container } = render(<ModuleSelector onSelectionChange={onSelectionChange} />);

    expect(getVisibleModuleNames(container)).toEqual(["Alpha", "Beta", "Gamma"]);

    act(() => {
      fireEvent.click(screen.getByText("Gamma"));
    });

    expect(getVisibleModuleNames(container)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("toggles selection on card click and adjusts count via stepper", () => {
    setCatalog(catalog);

    const onSelectionChange = vi.fn();
    render(<ModuleSelector onSelectionChange={onSelectionChange} />);

    act(() => {
      fireEvent.click(screen.getByText("Gamma"));
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ GAMMA: 1 });
    expect(screen.getByText("Selected: 1 module")).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByLabelText("Increase Gamma count"));
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ GAMMA: 2 });

    // clicking the card body again deselects (count back to 0, tray hidden)
    act(() => {
      fireEvent.click(screen.getByText("Gamma"));
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ GAMMA: 0 });
    expect(screen.queryByText(/^Selected:/)).not.toBeInTheDocument();
  });

  it("collapses the chip tray to 6 chips with a +N more toggle", () => {
    const bigCatalog: ModuleCatalogItem[] = Array.from({ length: 8 }, (_, i) => ({
      ...catalog[0],
      id: `mod-${i}`,
      name: `Module ${i}`,
      type: `MOD_${i}`,
    }));
    setCatalog(bigCatalog);

    render(<ModuleSelector onSelectionChange={vi.fn()} />);

    bigCatalog.forEach((m) => {
      act(() => {
        fireEvent.click(screen.getByText(m.name));
      });
    });

    expect(screen.getByText("Selected: 8 modules")).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
    expect(screen.queryByText("Module 7 × 1")).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText("+2 more"));
    });
    expect(screen.getByText("Module 7 × 1")).toBeInTheDocument();
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });
});
