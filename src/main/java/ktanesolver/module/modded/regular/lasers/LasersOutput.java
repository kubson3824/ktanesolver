package ktanesolver.module.modded.regular.lasers;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LasersOutput(List<Integer> positions, List<Integer> labels) implements ModuleOutput {}
