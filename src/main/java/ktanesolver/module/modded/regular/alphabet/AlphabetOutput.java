package ktanesolver.module.modded.regular.alphabet;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record AlphabetOutput(List<String> pressOrder) implements ModuleOutput {
}
