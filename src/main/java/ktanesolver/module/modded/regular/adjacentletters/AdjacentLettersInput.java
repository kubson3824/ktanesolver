package ktanesolver.module.modded.regular.adjacentletters;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record AdjacentLettersInput(List<String> letters) implements ModuleInput {
}
