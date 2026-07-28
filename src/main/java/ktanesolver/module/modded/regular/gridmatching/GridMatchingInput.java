package ktanesolver.module.modded.regular.gridmatching;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record GridMatchingInput(List<Boolean> grid, int focusRow, int focusColumn) implements ModuleInput {}
