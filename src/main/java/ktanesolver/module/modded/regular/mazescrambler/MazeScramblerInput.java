package ktanesolver.module.modded.regular.mazescrambler;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MazeScramblerInput(Integer startPosition, Integer goalPosition, List<Integer> mazeMarkings) implements ModuleInput {}
