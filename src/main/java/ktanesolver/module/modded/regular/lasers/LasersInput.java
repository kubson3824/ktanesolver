package ktanesolver.module.modded.regular.lasers;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LasersInput(List<Integer> labels, Integer startingTimeMinutes) implements ModuleInput {}
