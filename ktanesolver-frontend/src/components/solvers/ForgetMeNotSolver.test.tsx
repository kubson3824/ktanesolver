import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BombStatus, ModuleType, type BombEntity } from "../../types";
import ForgetMeNotSolver from "./ForgetMeNotSolver";

const store = {
  currentModule: {
    id: "module-1",
    moduleType: ModuleType.FORGET_ME_NOT,
    solved: true,
    state: {},
    solution: { sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2] },
  },
  round: { id: "round-1" },
  markModuleSolved: vi.fn(),
};

vi.mock("../../store/useRoundStore", () => ({
  useRoundStore: (selector: (state: typeof store) => unknown) => selector(store),
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

describe("ForgetMeNotSolver", () => {
  it("groups the final sequence by the selected size", async () => {
    render(<ForgetMeNotSolver bomb={bomb} />);

    const groupSize = await screen.findByLabelText("Group size");
    expect(groupSize).toHaveValue(1);
    expect(screen.queryByRole("button", { name: /group/i })).not.toBeInTheDocument();

    fireEvent.change(groupSize, { target: { value: "3" } });

    expect(screen.getAllByRole("group", { name: /Group \d/ })).toHaveLength(4);
    expect(screen.getByRole("group", { name: "Group 4" })).toHaveTextContent("012");
  });
});
