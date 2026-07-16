import { describe, expect, it } from "vitest";
import { toggleAnimalSelection } from "./ZooSolver";

describe("toggleAnimalSelection", () => {
  it("fills, removes, and limits the two selections", () => {
    expect(toggleAnimalSelection(["", ""], "Sheep")).toEqual(["Sheep", ""]);
    expect(toggleAnimalSelection(["Sheep", ""], "Penguin")).toEqual(["Sheep", "Penguin"]);
    expect(toggleAnimalSelection(["Sheep", "Penguin"], "Whale")).toEqual(["Sheep", "Penguin"]);
    expect(toggleAnimalSelection(["Sheep", "Penguin"], "Sheep")).toEqual(["", "Penguin"]);
  });
});
