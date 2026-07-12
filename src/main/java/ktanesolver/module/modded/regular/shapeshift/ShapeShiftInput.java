package ktanesolver.module.modded.regular.shapeshift;

import ktanesolver.logic.ModuleInput;

public record ShapeShiftInput(Edge left, Edge right) implements ModuleInput {
	public enum Edge { SQUARE, ROUND, POINT, CONCAVE }
}
