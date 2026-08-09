package ktanesolver.module.modded.regular.britishslang;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BritishSlangInput(String definition, List<String> buttons, boolean newAttempt) implements ModuleInput {}
