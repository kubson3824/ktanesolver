package ktanesolver.module.modded.regular.symboliccoordinates;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SymbolicCoordinatesInput(
	List<String> symbols,
	List<String> ledColors,
	boolean confirmStage
) implements ModuleInput {}
