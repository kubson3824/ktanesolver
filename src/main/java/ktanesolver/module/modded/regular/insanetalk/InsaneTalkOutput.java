package ktanesolver.module.modded.regular.insanetalk;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record InsaneTalkOutput(List<Integer> pressLabels, String phraseCode, boolean quoted) implements ModuleOutput {}
