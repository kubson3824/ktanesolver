import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { solveBattleship } from "../../services/battleshipService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import BattleshipSolver from "./BattleshipSolver";

const store = {
  currentModule: { id: "module-1", moduleType: ModuleType.BATTLESHIP, solved: false, state: {}, solution: {} },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
  updateModuleAfterSolve: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/battleshipService", () => ({ solveBattleship: vi.fn() }));

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

describe("BattleshipSolver", () => {
  beforeEach(() => {
    vi.mocked(solveBattleship)
      .mockResolvedValueOnce({ output: { safeLocations: ["A1", "B2"], shipLocations: [] }, solved: false })
      .mockResolvedValueOnce({ output: { safeLocations: ["A1", "B2"], shipLocations: ["B2"] }, solved: true });
  });

  it("requires every safe radar result before solving the board", async () => {
    render(<BattleshipSolver bomb={bomb} />);
    fireEvent.change(screen.getByLabelText("Length 1 ship count"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show safe radar cells" }));

    await screen.findByRole("button", { name: "A1: unknown" });
    const solve = screen.getByRole("button", { name: "Solve board" });
    expect(solve).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "A1: unknown" }));
    fireEvent.click(screen.getByRole("button", { name: "B2: unknown" }));
    fireEvent.click(screen.getByRole("button", { name: "B2: water" }));
    expect(solve).toBeEnabled();
    fireEvent.click(solve);

    await waitFor(() => expect(solveBattleship).toHaveBeenLastCalledWith(
      "round-1", "bomb-1", "module-1", expect.objectContaining({ radarShips: ["B2"] }),
    ));
  });
});
