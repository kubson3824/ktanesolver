package ktanesolver.module.modded.regular.pointoforder;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PointOfOrderOutput(List<Integer> activeRules, List<String> validCards) implements ModuleOutput {}
