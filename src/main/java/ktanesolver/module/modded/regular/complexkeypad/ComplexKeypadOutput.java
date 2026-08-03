package ktanesolver.module.modded.regular.complexkeypad;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ComplexKeypadOutput(List<Integer> pressPositions, String rule) implements ModuleOutput {
}
