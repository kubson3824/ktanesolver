import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { solveWhosOnFirst, type WhosOnFirstSolveResponse } from "../../services/whosOnFirstService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import WhosOnFirstSolver from "./WhosOnFirstSolver";

const store = {
  currentModule: { id: "module-1", moduleType: ModuleType.WHOS_ON_FIRST, solved: false, state: {}, solution: {} } as Record<string, unknown>,
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/whosOnFirstService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/whosOnFirstService")>()),
  solveWhosOnFirst: vi.fn(),
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

describe("WhosOnFirstSolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.currentModule = { id: "module-1", moduleType: ModuleType.WHOS_ON_FIRST, solved: false, state: {}, solution: {} };
  });

  it("shows backend validation failures instead of reading a missing output", async () => {
    vi.mocked(solveWhosOnFirst).mockResolvedValue({ reason: "Unknown display label: INVALID" });
    render(<WhosOnFirstSolver bomb={bomb} />);

    fireEvent.click(screen.getByRole("button", { name: "Solve stage 1" }));

    expect(await screen.findByText("Unknown display label: INVALID")).toBeInTheDocument();
  });

  it("does not duplicate a stage restored before the solve response arrives", async () => {
    let resolveSolve!: (response: WhosOnFirstSolveResponse) => void;
    vi.mocked(solveWhosOnFirst).mockReturnValue(new Promise((resolve) => { resolveSolve = resolve; }));
    const view = render(<WhosOnFirstSolver bomb={bomb} />);

    fireEvent.click(screen.getByRole("button", { name: "Solve stage 1" }));
    await waitFor(() => expect(solveWhosOnFirst).toHaveBeenCalledOnce());

    store.currentModule = {
      id: "module-1",
      moduleType: ModuleType.WHOS_ON_FIRST,
      solved: false,
      state: {
        language: "EN",
        displayHistory: ["RED"],
        buttonHistory: [{ MIDDLE_LEFT: "UHHH" }],
        buttonPressHistory: [{ MIDDLE_LEFT: "UHHH" }],
      },
      solution: {},
    };
    view.rerender(<WhosOnFirstSolver bomb={bomb} />);
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));

    await act(async () => resolveSolve({ output: { position: "MIDDLE_LEFT", buttonText: "UHHH" }, solved: false }));
    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
  });
});
