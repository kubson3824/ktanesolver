package ktanesolver.module.modded.regular.patterncube;

public record PatternCubePlacement(
	int selection, String symbol, String targetCell, String targetLetter,
	int currentOrientation, int targetOrientation, String rotation
) {}
