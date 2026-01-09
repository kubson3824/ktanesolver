package ktanesolver.module.modded.regular.anagrams;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record AnagramsOutput(List<String> possibleSolutions) implements ModuleOutput {
}
