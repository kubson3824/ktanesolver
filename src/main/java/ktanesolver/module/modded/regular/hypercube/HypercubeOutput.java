package ktanesolver.module.modded.regular.hypercube;

import ktanesolver.logic.ModuleOutput;

public record HypercubeOutput(int stage, String face, String targetColor, String vertex) implements ModuleOutput {}
