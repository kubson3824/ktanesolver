package ktanesolver.module.modded.regular.logicalbuttons;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LogicalButtonsOutput(int stage, List<Integer> pressButtons, boolean pressOperator) implements ModuleOutput {}
