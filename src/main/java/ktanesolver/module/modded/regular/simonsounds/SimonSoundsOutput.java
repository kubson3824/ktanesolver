package ktanesolver.module.modded.regular.simonsounds;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SimonSoundsOutput(int stage, List<String> presses, String sampleCondition, String inputCondition) implements ModuleOutput {}
