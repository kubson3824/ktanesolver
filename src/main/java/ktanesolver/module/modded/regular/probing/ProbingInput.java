package ktanesolver.module.modded.regular.probing;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ProbingInput(List<Integer> missingFrequenciesByWire) implements ModuleInput {
}
