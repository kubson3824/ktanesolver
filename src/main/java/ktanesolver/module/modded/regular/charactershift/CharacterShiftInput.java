package ktanesolver.module.modded.regular.charactershift;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record CharacterShiftInput(List<String> letters, List<Integer> digits) implements ModuleInput {}
