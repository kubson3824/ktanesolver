import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSolverModulePersistence } from "./useSolverModulePersistence";

describe("useSolverModulePersistence", () => {
  it("does not restore an empty backend solution as a typed result", () => {
    const onRestoreSolution = vi.fn();

    renderHook(() => useSolverModulePersistence({
      state: {},
      onRestoreState: vi.fn(),
      onRestoreSolution,
      extractSolution: (raw) => raw as { actions: unknown[] },
      currentModule: { id: "new-module", solved: false, state: {}, solution: {} },
      setIsSolved: vi.fn(),
    }));

    expect(onRestoreSolution).not.toHaveBeenCalled();
  });

  it("does not infer solved from an intermediate solution", () => {
    const setIsSolved = vi.fn();

    renderHook(() => useSolverModulePersistence({
      state: {},
      onRestoreState: vi.fn(),
      onRestoreSolution: vi.fn(),
      currentModule: { id: "square-button", solved: false, solution: { hold: true } },
      setIsSolved,
    }));

    expect(setIsSolved).not.toHaveBeenCalledWith(true);
  });
});
