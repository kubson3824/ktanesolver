package ktanesolver.module.modded.regular.threeleds;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ThreeLedsInput(List<String> colors, List<Boolean> initialStates) implements ModuleInput {}
