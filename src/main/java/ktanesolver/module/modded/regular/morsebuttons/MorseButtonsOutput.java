package ktanesolver.module.modded.regular.morsebuttons;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MorseButtonsOutput(List<Integer> pressPositions, List<Integer> ruleNumbers, List<String> characters, List<String> colors) implements ModuleOutput {}
