package ktanesolver.module.modded.regular.booleanvenndiagram;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BooleanVennDiagramOutput(String expression, List<String> regions) implements ModuleOutput {}
