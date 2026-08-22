package ktanesolver.module.modded.regular.wavetapping;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record WavetappingInput(int stage, String currentColor, List<String> unavailableColors, boolean resetHistory) implements ModuleInput {}
