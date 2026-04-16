package ktanesolver.module.modded.regular.alphabet;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record AlphabetInput(List<String> letters) implements ModuleInput {
}
