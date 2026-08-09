package ktanesolver.module.modded.regular.charactershift;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record CharacterShiftOutput(List<CharacterShiftSolution> solutions, int x, int y) implements ModuleOutput {}
