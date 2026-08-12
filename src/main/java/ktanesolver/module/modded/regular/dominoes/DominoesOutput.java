package ktanesolver.module.modded.regular.dominoes;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record DominoesOutput(String operation, List<Integer> values, List<Integer> order) implements ModuleOutput {}
