package ktanesolver.module.modded.regular.horriblememory;

import ktanesolver.logic.ModuleOutput;

public record HorribleMemoryOutput(int stage, int position, int label, String color) implements ModuleOutput {}
