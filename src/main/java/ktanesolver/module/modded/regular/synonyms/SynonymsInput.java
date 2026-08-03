package ktanesolver.module.modded.regular.synonyms;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SynonymsInput(Integer displayedNumber, List<WordPair> pairs) implements ModuleInput {
	public record WordPair(String okayWord, String cancelWord) {}
}
