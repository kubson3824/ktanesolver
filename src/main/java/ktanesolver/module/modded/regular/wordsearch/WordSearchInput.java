package ktanesolver.module.modded.regular.wordsearch;

import ktanesolver.logic.ModuleInput;

public record WordSearchInput(String corners, boolean confirmed) implements ModuleInput {}
