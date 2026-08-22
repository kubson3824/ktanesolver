package ktanesolver.module.modded.regular.insanetalk;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record InsaneTalkInput(String phrase, List<Integer> buttonLabels) implements ModuleInput {}
