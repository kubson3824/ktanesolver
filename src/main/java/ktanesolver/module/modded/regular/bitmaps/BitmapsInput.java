package ktanesolver.module.modded.regular.bitmaps;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BitmapsInput(List<Integer> whiteCounts, int uniformLineCoordinate, int squareCenterX) implements ModuleInput {}
