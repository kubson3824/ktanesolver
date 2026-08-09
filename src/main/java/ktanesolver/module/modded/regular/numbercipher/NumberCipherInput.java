package ktanesolver.module.modded.regular.numbercipher;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record NumberCipherInput(List<Integer> digits, List<String> lights) implements ModuleInput {}
