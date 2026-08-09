package ktanesolver.module.modded.regular.morsewar;

import ktanesolver.logic.ModuleInput;

public record MorseWarInput(String topRow, String middleRow, String bottomRow, String morseCode) implements ModuleInput {}
