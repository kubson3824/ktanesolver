package ktanesolver.module.modded.regular.simonsounds;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SimonSoundsInput(Integer stage, List<String> sampleSequence, Boolean finalStage) implements ModuleInput {}
