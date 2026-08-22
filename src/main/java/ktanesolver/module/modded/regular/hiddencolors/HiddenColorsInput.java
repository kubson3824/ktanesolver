package ktanesolver.module.modded.regular.hiddencolors;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HiddenColorsInput(String ledColor, List<String> buttonColors) implements ModuleInput {}
