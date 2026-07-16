import { describe, expect, it } from "vitest";
import { restoreSimonStatesStageHistory } from "../../services/simonStatesService";

describe("Simon States stage history", () => {
  it("restores completed stages from backend state after undoing a solve", () => {
    expect(restoreSimonStatesStageHistory(
      ["RED", "BLUE"],
      [["RED", "YELLOW"], ["GREEN"]],
    )).toEqual([
      { stage: 1, flashes: ["RED", "YELLOW"], press: "RED" },
      { stage: 2, flashes: ["GREEN"], press: "BLUE" },
    ]);
  });
});
