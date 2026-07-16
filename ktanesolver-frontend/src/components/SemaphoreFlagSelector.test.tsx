import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SemaphoreCharacterFigure } from "./SemaphoreFlagSelector";

describe("SemaphoreCharacterFigure", () => {
  it("maps letter and number solutions to their flag pose", () => {
    const { rerender } = render(<SemaphoreCharacterFigure character="B" />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/270°, 180°/);

    rerender(<SemaphoreCharacterFigure character="2" />);
    expect(screen.getByRole("img")).toHaveAccessibleName(/270°, 180°/);
  });
});
