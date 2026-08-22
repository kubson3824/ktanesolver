package ktanesolver.module.modded.regular.ultracube;

import ktanesolver.logic.ModuleOutput;

public record UltracubeOutput(int stage, String face, String targetColor, String vertex) implements ModuleOutput {}
