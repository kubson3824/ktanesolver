package ktanesolver.module.modded.regular.hexamaze;

import java.util.Map;

import ktanesolver.logic.ModuleInput;

public record HexamazeInput(
	Map<String, String> markings,
	int pawnQ,
	int pawnR,
	String pawnColor
) implements ModuleInput {}
