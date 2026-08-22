package ktanesolver.module.modded.regular.thematrix;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TheMatrixInput(String firstAccessCode, String secondAccessCode, List<String> words) implements ModuleInput {}
