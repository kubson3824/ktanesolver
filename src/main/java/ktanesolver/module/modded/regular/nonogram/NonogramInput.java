package ktanesolver.module.modded.regular.nonogram;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record NonogramInput(List<List<String>> colorPairs) implements ModuleInput {}
