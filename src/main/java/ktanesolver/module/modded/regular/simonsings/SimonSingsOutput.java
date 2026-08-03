package ktanesolver.module.modded.regular.simonsings;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SimonSingsOutput(int stage, List<String> press) implements ModuleOutput {}
