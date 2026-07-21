import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { solveButtonSequence } from "../../services/buttonSequenceService";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import ButtonSequenceSolver from "./ButtonSequenceSolver";

const store = {
  currentModule: { id: "module-1", moduleType: ModuleType.BUTTON_SEQUENCE, solved: false, state: {}, solution: {} },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
}));
vi.mock("../../services/buttonSequenceService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/buttonSequenceService")>()),
  solveButtonSequence: vi.fn(),
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

const enterPanel = () => {
  const values = [
    ["RED", "ABORT", "SQUARE"],
    ["BLUE", "HOLD", "CIRCLE"],
    ["WHITE", "PRESS", "HEXAGON"],
  ];
  values.forEach(([color, label, shape], index) => {
    fireEvent.change(screen.getByLabelText(`Button ${index + 1} color`), { target: { value: color } });
    fireEvent.change(screen.getByLabelText(`Button ${index + 1} label`), { target: { value: label } });
    fireEvent.change(screen.getByLabelText(`Button ${index + 1} shape`), { target: { value: shape } });
  });
};

describe("ButtonSequenceSolver", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits a complete panel in display order and advances with a safe tap-only Twitch command", async () => {
    vi.mocked(solveButtonSequence).mockResolvedValue({
      output: {
        panel: 1,
        actions: ["PRESS", "SKIP", "PRESS"],
        colorOccurrences: { RED: 1, YELLOW: 0, BLUE: 1, WHITE: 1 },
      },
      solved: false,
    });
    render(<ButtonSequenceSolver bomb={bomb} />);

    const solve = screen.getByRole("button", { name: "Solve panel 1" });
    expect(solve).toBeDisabled();
    enterPanel();
    expect(solve).toBeEnabled();
    fireEvent.click(solve);

    await waitFor(() => expect(solveButtonSequence).toHaveBeenCalledWith(
      "round-1", "bomb-1", "module-1", 1,
      [
        { color: "RED", label: "ABORT", shape: "SQUARE" },
        { color: "BLUE", label: "HOLD", shape: "CIRCLE" },
        { color: "WHITE", label: "PRESS", shape: "HEXAGON" },
      ],
    ));
    expect(screen.getByRole("button", { name: "Solve panel 2" })).toBeDisabled();
    expect(screen.getByText("!number tap 1 3 down")).toBeInTheDocument();
  });

  it("shows the exact release table and withholds a one-shot Twitch command for a hold", async () => {
    vi.mocked(solveButtonSequence).mockResolvedValue({
      output: {
        panel: 1,
        actions: ["SKIP", "HOLD", "PRESS"],
        colorOccurrences: { RED: 1, YELLOW: 0, BLUE: 1, WHITE: 1 },
      },
      solved: false,
    });
    render(<ButtonSequenceSolver bomb={bomb} />);
    enterPanel();
    fireEvent.click(screen.getByRole("button", { name: "Solve panel 1" }));

    expect(await screen.findByText(/Blue 2 · White 7 · Yellow 3 · Magenta 4/)).toBeInTheDocument();
    expect(screen.queryByText(/!number tap/)).not.toBeInTheDocument();
  });
});
