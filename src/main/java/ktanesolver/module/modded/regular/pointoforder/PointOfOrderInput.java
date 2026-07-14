package ktanesolver.module.modded.regular.pointoforder;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PointOfOrderInput(List<String> cards) implements ModuleInput {}
