
package ktanesolver.module.vanilla.regular.morse;

import ktanesolver.logic.ModuleInput;

public record MorseInput(String word, String language, String morse) implements ModuleInput {
	public MorseInput(String word) {
		this(word, "EN", null);
	}
}
