package ktanesolver.module.modded.regular.hiddencolors;

import java.util.Map;
import ktanesolver.logic.ModuleOutput;

public record HiddenColorsOutput(int greenButton, int correctButton, int appliedRule, Map<String, Integer> namedButtons) implements ModuleOutput {}
