package ktanesolver.module.modded.regular.adjacentletters;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record AdjacentLettersOutput(List<String> pressLetters) implements ModuleOutput {
}
