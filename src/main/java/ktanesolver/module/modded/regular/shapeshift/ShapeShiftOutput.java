package ktanesolver.module.modded.regular.shapeshift;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.shapeshift.ShapeShiftInput.Edge;

public record ShapeShiftOutput(Edge left, Edge right) implements ModuleOutput {}
