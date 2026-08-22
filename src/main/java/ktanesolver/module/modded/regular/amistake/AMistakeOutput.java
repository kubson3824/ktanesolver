package ktanesolver.module.modded.regular.amistake;

import ktanesolver.logic.ModuleOutput;

public record AMistakeOutput(int stage, String timing, String twitchCommand, int nextStage) implements ModuleOutput {}
