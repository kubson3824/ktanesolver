package ktanesolver.module.modded.regular.dominoes;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record DominoesInput(List<List<Integer>> dominoes) implements ModuleInput {}
