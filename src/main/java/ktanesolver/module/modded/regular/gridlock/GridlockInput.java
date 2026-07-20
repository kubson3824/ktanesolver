package ktanesolver.module.modded.regular.gridlock;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record GridlockInput(List<List<String>> pages) implements ModuleInput {}
