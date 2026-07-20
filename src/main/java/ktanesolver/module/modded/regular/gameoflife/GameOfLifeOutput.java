package ktanesolver.module.modded.regular.gameoflife;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GameOfLifeOutput(List<Boolean> whiteCells, boolean submitInitial) implements ModuleOutput {}
