package ktanesolver.module.modded.regular.simonsamples;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SimonSamplesInput(int stage, String call, List<String> padSounds) implements ModuleInput {}
