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
  modules: [{ id: "source-1", type, solved: true, version: 0, state: {}, solution: {} }],
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

  it("asks which Probing wire was named and returns that frequency", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "10Hz", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.PROBING)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "yellow-black" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("10Hz")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "yellow-black",
      finalQuestion: false,
    });
  });

  it("asks which Third Base stage was named", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "SNZX", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.THIRD_BASE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "firstDisplay" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("SNZX")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "firstDisplay",
      finalQuestion: false,
    });
  });

  it("asks the exact Murder weapon question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "LEAD PIPE, REVOLVER, SPANNER", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MURDER)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "potentialWeaponNotMurderWeapon" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("LEAD PIPE, REVOLVER, SPANNER")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "potentialWeaponNotMurderWeapon",
      finalQuestion: false,
    });
  });

  it("uses the exact question and displayed answers when provided", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "SPANNER", answerIndex: 3 }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MURDER)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByLabelText("Enter Souvenir’s displayed answers (most reliable)"));
    fireEvent.change(screen.getByLabelText("Exact Souvenir question"), {
      target: { value: "Which of these was a potential weapon but not the murder weapon in Murder?" },
    });
    ["CANDLESTICK", "ROPE", "SPANNER", "DAGGER"].forEach((answer, index) => {
      fireEvent.change(screen.getByLabelText(`Answer ${index + 1}`), { target: { value: answer } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("SPANNER")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "Which of these was a potential weapon but not the murder weapon in Murder?",
      answers: ["CANDLESTICK", "ROPE", "SPANNER", "DAGGER"],
      finalQuestion: false,
    });
  });

  it("auto-selects the Mouse in the Maze torus question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "YELLOW", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MOUSE_IN_THE_MAZE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    expect(screen.queryByLabelText("Exact Souvenir question")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("YELLOW")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "torusColor",
      finalQuestion: false,
    });
  });

  it("requires Mafia's displayed choices so the excluded Godfather is actionable", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "John", answerIndex: 4 }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MAFIA)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    expect(screen.getByLabelText("Enter Souvenir’s displayed answers (most reliable)")).toBeDisabled();
    ["Mary", "Larry", "Kate", "John", "Diane", "Mac"].forEach((answer, index) => {
      fireEvent.change(screen.getByLabelText(`Answer ${index + 1}`), { target: { value: answer } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("John")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "Who was a player, but not the Godfather?",
      answers: ["Mary", "Larry", "Kate", "John", "Diane", "Mac"],
      finalQuestion: false,
    });
  });

  it("auto-selects the Big Circle spin-direction question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "counterclockwise", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.BIG_CIRCLE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("counterclockwise")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "spinDirection",
      finalQuestion: false,
    });
  });

  it("shows X-Ray answers as the scanned glyphs", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "a1 flipped, h6, f10", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.X_RAY)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("Match any of these scanned symbols:")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "X-Ray symbol" })).toHaveLength(3);
  });

  it.each([
    ["firstDisplayedSymbols", "o, M"],
    ["secondDisplayedSymbols", "U, W"],
    ["thirdDisplayedSymbols", "z, f"],
    ["fourthDisplayedSymbols", "H, A"],
  ])("asks for Hunting's %s and renders both pictograms", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.HUNTING)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("These two pictograms were displayed:")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Hunting pictogram/ })).toHaveLength(2);
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question, finalQuestion: false,
    });
  });

  it("auto-selects the Game of Life Cruel color-combination question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "Black/Orange, Solid Red", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.GAME_OF_LIFE_CRUEL)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("Black/Orange, Solid Red")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "colorCombinations",
      finalQuestion: false,
    });
  });

  it.each([
    ["second color", "Orange"],
    ["third character", "B"],
  ])("asks the requested Color Morse LED fact", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.COLOR_MORSE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question,
      finalQuestion: false,
    });
  });

  it.each([
    ["cardNames", "Aluga, Bob, Buhar"],
    ["printVersions", "A2, C4, I8"],
  ])("asks the requested Monsplode Trading Cards fact", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MONSPLODE_TRADING_CARDS)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question,
      finalQuestion: false,
    });
  });

  it.each([
    ["startingColor", "Blue"],
    ["startingLocation", "C4"],
  ])("asks the requested Gridlock starting fact", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.GRIDLOCK)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question,
      finalQuestion: false,
    });
  });

  it("accepts the exact question for a module without a preset", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "GREEN", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.MICROCONTROLLER)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Exact Souvenir question"), {
      target: { value: "What color was the second pin in Microcontroller?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("GREEN")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "What color was the second pin in Microcontroller?",
      finalQuestion: false,
    });
  });
});
