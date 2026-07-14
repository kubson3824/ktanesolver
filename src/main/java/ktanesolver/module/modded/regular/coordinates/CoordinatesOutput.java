package ktanesolver.module.modded.regular.coordinates;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record CoordinatesOutput(int width, int height, List<String> matchingClues) implements ModuleOutput {}
