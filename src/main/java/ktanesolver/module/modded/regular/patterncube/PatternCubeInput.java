package ktanesolver.module.modded.regular.patterncube;

import java.util.List;
import java.util.Map;

import ktanesolver.logic.ModuleInput;

public record PatternCubeInput(
	Integer group1, Integer group2, List<String> netCells, Map<String, String> cellLetters,
	String givenCell, String givenSymbol, Integer givenOrientation,
	String highlightedCell, String highlightedSymbol, List<PatternCubeSymbolInput> selections
) implements ModuleInput {}
