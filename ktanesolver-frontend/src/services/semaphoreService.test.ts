import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { solveSemaphore } from "./semaphoreService";

describe("solveSemaphore", () => {
  afterEach(() => vi.restoreAllMocks());

  it("omits display-only character labels from the solve input", async () => {
    vi.spyOn(api, "post").mockResolvedValue({ data: { output: { missingCharacter: "B", resolved: true } } });
    const sequence = [{ leftFlagAngle: 225, rightFlagAngle: 180, character: "A (1)" }];

    await solveSemaphore("round", "bomb", "module", { sequence });

    expect(api.post).toHaveBeenCalledWith(
      "/rounds/round/bombs/bomb/modules/module/solve",
      { input: { sequence: [{ leftFlagAngle: 225, rightFlagAngle: 180 }] } },
    );
  });
});
