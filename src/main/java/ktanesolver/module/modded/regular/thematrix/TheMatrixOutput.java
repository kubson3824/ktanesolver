package ktanesolver.module.modded.regular.thematrix;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TheMatrixOutput(List<String> accessCodeNames, int accessSeconds, int listNumber, String glitchWord, String pill, int timerDigit) implements ModuleOutput {}
