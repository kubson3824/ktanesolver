package ktanesolver.module.modded.regular.greenarrows;

import ktanesolver.logic.ModuleOutput;

public record GreenArrowsOutput(String direction, int streakAfterPress, boolean finalPress) implements ModuleOutput {}
