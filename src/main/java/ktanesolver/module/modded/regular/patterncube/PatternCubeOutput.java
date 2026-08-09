package ktanesolver.module.modded.regular.patterncube;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PatternCubeOutput(List<PatternCubePlacement> placements) implements ModuleOutput {}
