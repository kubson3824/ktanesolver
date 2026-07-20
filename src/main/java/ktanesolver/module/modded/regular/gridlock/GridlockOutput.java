package ktanesolver.module.modded.regular.gridlock;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GridlockOutput(String coordinate, List<String> path) implements ModuleOutput {}
