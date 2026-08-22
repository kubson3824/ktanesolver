package ktanesolver.module.modded.regular.findthedate;

import ktanesolver.logic.ModuleOutput;

public record FindTheDateOutput(int stage, String weekday, int nextStage) implements ModuleOutput {}
