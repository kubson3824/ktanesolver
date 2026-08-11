package ktanesolver.module.modded.regular.shikaku;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ShikakuInput(List<Clue> clues) implements ModuleInput {
	public record Clue(String cell, String shown, String alternate) {}
}
