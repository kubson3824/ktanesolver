package ktanesolver.module.modded.regular.braille;

import ktanesolver.logic.ModuleOutput;

public record BrailleOutput(String word, int pressPosition) implements ModuleOutput {}
