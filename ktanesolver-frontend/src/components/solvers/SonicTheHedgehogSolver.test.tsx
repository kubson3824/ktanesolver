import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { solveSonicTheHedgehog } from "../../services/sonicTheHedgehogService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import SonicTheHedgehogSolver from "./SonicTheHedgehogSolver";

const store = {
  currentModule: { id: "sonic-1", moduleType: ModuleType.SONIC_THE_HEDGEHOG, solved: false, state: {}, solution: {} },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
  updateModuleAfterSolve: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/sonicTheHedgehogService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/sonicTheHedgehogService")>()),
  solveSonicTheHedgehog: vi.fn(),
}));

const bomb: BombEntity = {
  id: "bomb-1",
  serialNumber: "ABC123",
  aaBatteryCount: 0,
  dBatteryCount: 0,
  indicators: {},
  portPlates: [],
  status: BombStatus.ACTIVE,
  strikes: 0,
  modules: [],
};

describe("SonicTheHedgehogSolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(solveSonicTheHedgehog).mockResolvedValue({
      output: { stage: 1, button: "Rg", monitor: "Rings" },
      solved: false,
    });
  });

  it("submits the sounds in physical monitor order and advances one picture at a time", async () => {
    render(<SonicTheHedgehogSolver bomb={bomb} />);
    fireEvent.change(screen.getByLabelText("Running Boots sound"), { target: { value: "Breathe" } });
    fireEvent.change(screen.getByLabelText("Invincibility sound"), { target: { value: "Bumper" } });
    fireEvent.change(screen.getByLabelText("Extra Life sound"), { target: { value: "Skid" } });
    fireEvent.change(screen.getByLabelText("Rings sound"), { target: { value: "Jump" } });
    fireEvent.change(screen.getByLabelText("Level 1 picture"), { target: { value: "Ballhog" } });
    fireEvent.click(screen.getByRole("button", { name: "Solve level 1" }));

    await waitFor(() => expect(solveSonicTheHedgehog).toHaveBeenCalledWith("round-1", "bomb-1", "sonic-1", {
      stage: 1,
      sounds: ["Breathe", "Bumper", "Skid", "Jump"],
      picture: "Ballhog",
    }));
    expect(await screen.findByText("Rg")).toBeInTheDocument();
    expect(screen.getByText("!number press Rg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enter level 2 picture" }));
    expect(screen.getByLabelText("Level 2 picture")).toBeInTheDocument();
    expect(screen.queryByLabelText("Running Boots sound")).not.toBeInTheDocument();
  });

  it("clears every generated fact after a strike", async () => {
    render(<SonicTheHedgehogSolver bomb={bomb} />);
    for (const [label, value] of [
      ["Running Boots sound", "Breathe"],
      ["Invincibility sound", "Bumper"],
      ["Extra Life sound", "Skid"],
      ["Rings sound", "Jump"],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.change(screen.getByLabelText("Level 1 picture"), { target: { value: "Ballhog" } });
    fireEvent.click(screen.getByRole("button", { name: "Solve level 1" }));
    await screen.findByText("Rg");

    fireEvent.click(screen.getByRole("button", { name: "This press struck" }));

    expect(screen.getByLabelText("Level 1 picture")).toHaveValue("");
    expect(screen.getByLabelText("Running Boots sound")).toHaveValue("");
    expect(screen.queryByText("!number press Rg")).not.toBeInTheDocument();
  });
});
