package ktanesolver.module.modded.regular.hexamaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record HexamazeOutput(
	List<String> moves,
	int mazeCenterQ,
	int mazeCenterR,
	int clockwiseRotation,
	List<String> walls
) implements ModuleOutput {}
