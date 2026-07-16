import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { solveSouvenir } from "../../services/souvenirService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import SouvenirSolver from "./SouvenirSolver";

const store = {
  currentModule: { id: "souvenir-1", type: ModuleType.SOUVENIR, moduleType: ModuleType.SOUVENIR, solved: false, state: {}, solution: {} },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
  updateModuleAfterSolve: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/souvenirService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/souvenirService")>()),
  solveSouvenir: vi.fn(),
}));

const bomb = (type: ModuleType): BombEntity => ({
  id: "bomb-1",
  serialNumber: "ABC123",
  aaBatteryCount: 0,
  dBatteryCount: 0,
  indicators: {},
  portPlates: [],
  status: BombStatus.ACTIVE,
  strikes: 0,
  modules: [{ id: "source-1", type, solved: true, state: {}, solution: {} }],
});

describe("SouvenirSolver", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a dropdown only when the source has multiple question families", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.MEMORY)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    expect(screen.getByLabelText("Question")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Answer 1")).not.toBeInTheDocument();
  });

  it("auto-selects a single question and returns the recorded answer", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "E", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.TEXT_FIELD)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    expect(screen.queryByLabelText("Question")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("E")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "displayedLetter",
      finalQuestion: false,
    });
  });
});
