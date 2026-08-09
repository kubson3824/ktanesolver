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

  it("asks The Swan reset-count question directly", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "13", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.THE_SWAN)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("13")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "resetCount",
      finalQuestion: false,
    });
  });

  it.each([
    ["hairColorsWas", "Black, Brown, Red"],
    ["hairColorsWasNot", "Blonde, Grey, White"],
    ["buildsWas", "Hunched, Short, Tall"],
    ["buildsWasNot", "Fat, Muscular, Slim"],
    ["attiresWas", "Blazer, Suit, T-shirt"],
    ["attiresWasNot", "Hoodie, Jumper, Tank top"],
  ])("asks Identity Parade's %s question directly", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.IDENTITY_PARADE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question, finalQuestion: false,
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

  it("auto-selects the Polyhedral Maze starting-position question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "0", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.POLYHEDRAL_MAZE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    expect(screen.queryByLabelText("Question")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("0")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "startPosition",
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

  it.each([
    ["displayedNumber", "4"],
    ["mainCountry", "Canada"],
  ])("asks for Flags' %s fact directly", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.FLAGS)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question, finalQuestion: false,
    });
  });

  it("requires Flags' displayed choices for the non-main country question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "Japan", answerIndex: 2 }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.FLAGS)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "countries" } });
    expect(screen.getByLabelText("Enter Souvenir’s displayed answers (most reliable)")).toBeDisabled();
    ["Brazil", "Japan", "China", "Poland", "Mexico", "Samoa"].forEach((answer, index) => {
      fireEvent.change(screen.getByLabelText(`Answer ${index + 1}`), { target: { value: answer } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("Japan")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1",
      question: "Which of these country flags was shown, but not the main country flag, in Flags?",
      answers: ["Brazil", "Japan", "China", "Poland", "Mexico", "Samoa"],
      finalQuestion: false,
    });
  });

  it("hides Flags instances for which Souvenir legitimately asks no question", () => {
    const flagsBomb = bomb(ModuleType.FLAGS);
    flagsBomb.modules[0].state = { unicornRule: true };
    render(<SouvenirSolver bomb={flagsBomb} />);

    expect(screen.queryByRole("option", { name: /Flags/ })).not.toBeInTheDocument();
  });

  it("offers every Simon's Star flash position", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "PURPLE", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.SIMONS_STAR)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "flash fifth" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText("PURPLE")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question: "flash fifth", finalQuestion: false,
    });
  });

  it("offers every Morse War question family", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.MORSE_WAR)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Code transmitted in Morse", "LEDs in the bottom row", "LEDs in the middle row", "LEDs in the top row"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers every Maze Scrambler question family", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.MAZE_SCRAMBLER)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Starting position", "Goal position", "Which positions were maze markings?"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers all four Alphabet Numbers stage questions", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.ALPHABET_NUMBERS)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Numbers in the first stage", "Numbers in the second stage", "Numbers in the third stage", "Numbers in the fourth stage"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers both Double Color stage questions", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.DOUBLE_COLOR)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Screen color in the first stage", "Screen color in the second stage"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers both Maritime Flags question families", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.MARITIME_FLAGS)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Signalled bearing", "Signalled callsign"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers and renders Pattern Cube's highlighted symbol question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "X", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.PATTERN_CUBE)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));
    expect(await screen.findByRole("img", { name: "Pattern Cube symbol X" })).toBeInTheDocument();
  });

  it("offers every Know Your Way question family", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.KNOW_YOUR_WAY)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });

    ["Arrow direction", "Green LED position"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("resolves Splitting The Loot's initially colored bag question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "E6", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.SPLITTING_THE_LOOT)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));
    expect(await screen.findByText("E6")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question: "initiallyColoredBag", finalQuestion: false,
    });
  });

  it("offers every Character Shift question family", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.CHARACTER_SHIFT)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    ["Unsubmitted slider letter", "Unsubmitted slider digit"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("offers every Simon Samples stage argument", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.SIMON_SAMPLES)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    ["Call samples played in the first stage", "Call samples added in the second stage", "Call samples added in the third stage"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("resolves Dragon Energy's indicator color question", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "Purple", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.DRAGON_ENERGY)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));
    expect(await screen.findByText("Purple")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question: "indicatorColor", finalQuestion: false,
    });
  });

  it("offers and resolves both Uncolored Squares first-stage colors", async () => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer: "Green", answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.UNCOLORED_SQUARES)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    expect(screen.getByRole("option", { name: "First color in reading order in the first stage" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "firstStageColor second" } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));
    expect(await screen.findByText("Green")).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question: "firstStageColor second", finalQuestion: false,
    });
  });

  it("offers all ten Flashing Lights LED/color questions", () => {
    render(<SouvenirSolver bomb={bomb(ModuleType.FLASHING_LIGHTS)} />);
    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    ["Top LED — cyan", "Top LED — orange", "Bottom LED — cyan", "Bottom LED — orange"]
      .forEach((label) => expect(screen.getByRole("option", { name: label })).toBeInTheDocument());
  });

  it("hides Calendar instances whose holiday remains visible in the target month", () => {
    const calendarBomb = bomb(ModuleType.CALENDAR);
    calendarBomb.modules[0].state = { souvenirEligible: false };
    render(<SouvenirSolver bomb={calendarBomb} />);

    expect(screen.queryByRole("option", { name: /Calendar/ })).not.toBeInTheDocument();
  });

  it.each([
    ["departureCity", "Buenos Aires"],
    ["destinationCity", "Tarawa"],
  ])("asks for Timezone's %s directly", async (question, answer) => {
    vi.mocked(solveSouvenir).mockResolvedValue({ output: { answer, answerIndex: null }, solved: false });
    render(<SouvenirSolver bomb={bomb(ModuleType.TIMEZONE)} />);

    fireEvent.change(screen.getByLabelText("Source module"), { target: { value: "source-1" } });
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Show recorded answer" }));

    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(solveSouvenir).toHaveBeenCalledWith("round-1", "bomb-1", "souvenir-1", {
      sourceModuleId: "source-1", question, finalQuestion: false,
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
