package ktanesolver.module.modded.regular.yahtzee;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record YahtzeeOutput(int rollNumber, String action, List<String> keepColors, List<String> rerollColors) implements ModuleOutput {}
