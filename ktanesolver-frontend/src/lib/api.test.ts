import { describe, expect, it } from "vitest";
import { withErrorWrapping } from "./api";

describe("withErrorWrapping", () => {
  it("turns solver failure responses into errors", async () => {
    await expect(withErrorWrapping(async () => ({ reason: "Unknown display text" })))
      .rejects.toThrow("Unknown display text");
  });
});
