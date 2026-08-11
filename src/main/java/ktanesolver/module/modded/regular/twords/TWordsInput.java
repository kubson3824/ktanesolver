package ktanesolver.module.modded.regular.twords;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TWordsInput(LedColor ledColor, List<String> words) implements ModuleInput {
	public enum LedColor { BLUE, GREEN, ORANGE, RED, PURPLE }
}
