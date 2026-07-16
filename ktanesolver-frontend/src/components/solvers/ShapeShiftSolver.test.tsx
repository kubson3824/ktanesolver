import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { Shape } from "./ShapeShiftSolver";

it("draws concave joins instead of an inward midpoint", () => {
  const { container, rerender } = render(<Shape left="CONCAVE" right="SQUARE" />);
  expect(container.querySelector("path")?.getAttribute("d"))
    .toBe("M 25 15 L 95 15 L 95 65 L 25 65 Q 25 50 15 50 L 15 30 Q 25 30 25 15 Z");

  rerender(<Shape left="SQUARE" right="CONCAVE" />);
  expect(container.querySelector("path")?.getAttribute("d"))
    .toBe("M 25 15 L 95 15 Q 95 30 105 30 L 105 50 Q 95 50 95 65 L 25 65 L 25 15 Z");
});
