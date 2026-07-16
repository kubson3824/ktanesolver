package ktanesolver.module.modded.regular.yahtzee;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record YahtzeeInput(List<Integer> dice) implements ModuleInput {}
