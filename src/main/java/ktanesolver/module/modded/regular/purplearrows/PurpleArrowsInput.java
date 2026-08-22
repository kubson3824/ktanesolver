package ktanesolver.module.modded.regular.purplearrows;

import ktanesolver.logic.ModuleInput;

public record PurpleArrowsInput(String displayedLetter, String scrambledWord, boolean reset) implements ModuleInput {}
