package ktanesolver.module.modded.regular.buttongrid;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.buttongrid.ButtonGridInput.Color;

public record ButtonGridOutput(List<Integer> positions, List<List<Color>> stageOrders, boolean instantSolve) implements ModuleOutput {}
