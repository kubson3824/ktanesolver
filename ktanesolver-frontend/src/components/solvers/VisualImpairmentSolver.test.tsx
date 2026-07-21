import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { solveVisualImpairment } from "../../services/visualImpairmentService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import VisualImpairmentSolver from "./VisualImpairmentSolver";

const store = {
  currentModule: { id: "module-1", type: ModuleType.VISUAL_IMPAIRMENT, solved: false, state: {}, solution: {} },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
  updateModuleAfterSolve: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/visualImpairmentService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/visualImpairmentService")>()),
  solveVisualImpairment: vi.fn(),
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

describe("VisualImpairmentSolver", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a color only when the player confirms the stage completed", async () => {
    vi.mocked(solveVisualImpairment).mockResolvedValue({
      output: { positions: ["A1", "C3"], pictureNumber: 1, stage: 1 }, solved: false,
    });
    render(<VisualImpairmentSolver bomb={bomb} />);

    for (let row = 1; row <= 5; row++) {
      fireEvent.change(screen.getByLabelText(`Row ${row} shades`), { target: { value: "11111" } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Red" }));
    fireEvent.click(screen.getByRole("button", { name: "Find squares" }));

    await screen.findByText("Picture 1 · A1 C3");
    expect(solveVisualImpairment).toHaveBeenLastCalledWith("round-1", "bomb-1", "module-1", {
      shades: Array(25).fill(1), desiredColor: "Red", stageComplete: false, moduleSolved: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Stage completed — next stage" }));
    await waitFor(() => expect(solveVisualImpairment).toHaveBeenLastCalledWith("round-1", "bomb-1", "module-1", {
      shades: Array(25).fill(1), desiredColor: "Red", stageComplete: true, moduleSolved: false,
    }));
    expect(await screen.findByText("Stage 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Row 1 shades")).toHaveValue("");
  });
});
