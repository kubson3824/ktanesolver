import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SolverControls from "./SolverControls";

describe("SolverControls", () => {
  it("submits only once while a solve is in flight", () => {
    const onSolve = vi.fn(() => new Promise<void>(() => undefined));

    render(<SolverControls onSolve={onSolve} onReset={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Solve" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onSolve).toHaveBeenCalledOnce();
  });
});
