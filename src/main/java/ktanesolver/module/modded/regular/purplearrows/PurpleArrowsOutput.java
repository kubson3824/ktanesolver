package ktanesolver.module.modded.regular.purplearrows;

import ktanesolver.logic.ModuleOutput;

public record PurpleArrowsOutput(String action, String targetWord, int remainingCandidates, boolean identified, boolean submit) implements ModuleOutput {}
