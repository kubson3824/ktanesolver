package ktanesolver.module.modded.regular.seashells;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SeaShellsOutput(List<String> pressOrder, int stage) implements ModuleOutput {}
