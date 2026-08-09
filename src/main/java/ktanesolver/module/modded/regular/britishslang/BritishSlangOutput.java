package ktanesolver.module.modded.regular.britishslang;

import ktanesolver.logic.ModuleOutput;

public record BritishSlangOutput(int stage, int pressPosition, String pressLabel, int nextStage) implements ModuleOutput {}
