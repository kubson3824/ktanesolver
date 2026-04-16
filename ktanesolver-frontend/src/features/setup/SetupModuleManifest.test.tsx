import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SetupModuleManifest from "./SetupModuleManifest";
import { ModuleType, type ModuleEntity } from "../../types";

const createModule = (id: string, type: ModuleType): ModuleEntity => ({
  id,
  type,
  solved: false,
  state: {},
  solution: {},
});

describe("SetupModuleManifest", () => {
  it("renders current modules and lets the user remove an individual module", () => {
    const onRemove = vi.fn();

    render(
      <SetupModuleManifest
        modules={[
          createModule("module-1", ModuleType.BUTTON),
          createModule("module-2", ModuleType.WIRES),
        ]}
        canRemove
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(screen.getByText("Wires")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Button #1" }));

    expect(onRemove).toHaveBeenCalledWith("module-1");
  });

  it("disables removal when the round is no longer in setup", () => {
    render(
      <SetupModuleManifest
        modules={[createModule("module-1", ModuleType.BUTTON)]}
        canRemove={false}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Remove Button #1" })).toBeDisabled();
    expect(screen.getByText("Module removal is only available during setup.")).toBeInTheDocument();
  });
});
