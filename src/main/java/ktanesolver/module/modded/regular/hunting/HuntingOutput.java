package ktanesolver.module.modded.regular.hunting;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record HuntingOutput(int stage, List<String> decoys, Integer safeButton) implements ModuleOutput {}
