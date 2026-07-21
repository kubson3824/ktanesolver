package ktanesolver.module.modded.regular.ledgrid;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LedGridOutput(List<String> pressOrder, int unlitCount) implements ModuleOutput {}
