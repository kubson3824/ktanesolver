import { describe, expect, it } from "vitest";
import { decodeMorse } from "./MorsematicsSolver";

describe("decodeMorse", () => {
  it("decodes three entered patterns and marks invalid ones", () => {
    expect(decodeMorse(".- -... -.-.")).toBe("ABC");
    expect(decodeMorse(".- -----")).toBe("A?");
  });
});
