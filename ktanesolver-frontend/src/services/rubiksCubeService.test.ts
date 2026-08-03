import { describe, expect, it } from "vitest";
import { getRubiksCubeMoveDisplay } from "./rubiksCubeService";

describe("getRubiksCubeMoveDisplay", () => {
  it("describes clockwise and counter-clockwise moves", () => {
    expect(getRubiksCubeMoveDisplay("R")).toEqual({ face: "R", direction: "clockwise", arrow: "↻" });
    expect(getRubiksCubeMoveDisplay("U'")).toEqual({ face: "U", direction: "counter-clockwise", arrow: "↺" });
  });
});
