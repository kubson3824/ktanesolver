package ktanesolver.module.modded.regular.braille;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BrailleInput(List<Integer> patterns) implements ModuleInput {}
