package ktanesolver.module.modded.regular.simonsamples;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SimonSamplesOutput(int stage, List<String> response, List<Integer> presses) implements ModuleOutput {}
