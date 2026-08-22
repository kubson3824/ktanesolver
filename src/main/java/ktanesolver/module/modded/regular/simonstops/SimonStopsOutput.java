package ktanesolver.module.modded.regular.simonstops;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.simonstops.SimonStopsInput.Color;

public record SimonStopsOutput(int stage, List<Color> pressColors, boolean awaitingControlPosition, int nextStage) implements ModuleOutput {}
