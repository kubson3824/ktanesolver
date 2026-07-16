import { describe, expect, it } from "vitest";
import {
  getMicrocontrollerPinRows,
  type MicrocontrollerPinSolution,
} from "../../services/microcontrollerService";

describe("getMicrocontrollerPinRows", () => {
  it("lays pins out down the marked side and back up the opposite side", () => {
    const pins = Array.from({ length: 8 }, (_, index) => ({ pin: index + 1 })) as MicrocontrollerPinSolution[];

    expect(getMicrocontrollerPinRows(pins).map((row) => row.map((pin) => pin.pin))).toEqual([
      [1, 8],
      [2, 7],
      [3, 6],
      [4, 5],
    ]);
  });
});
