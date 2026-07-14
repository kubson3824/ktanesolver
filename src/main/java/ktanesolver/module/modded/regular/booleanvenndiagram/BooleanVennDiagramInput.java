package ktanesolver.module.modded.regular.booleanvenndiagram;

import ktanesolver.logic.ModuleInput;

public record BooleanVennDiagramInput(String firstOperator, String secondOperator, String grouping) implements ModuleInput {}
