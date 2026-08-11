package ktanesolver.module.modded.regular.twords;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TWordsOutput(int column, List<Integer> positions, List<String> orderedWords) implements ModuleOutput {}
