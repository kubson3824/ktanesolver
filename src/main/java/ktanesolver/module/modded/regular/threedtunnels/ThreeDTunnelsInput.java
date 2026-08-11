package ktanesolver.module.modded.regular.threedtunnels;

import ktanesolver.logic.ModuleInput;

public record ThreeDTunnelsInput(
	String currentSymbol,
	String targetSymbol,
	Boolean frontWall,
	Boolean leftWall,
	Boolean rightWall,
	Boolean upWall,
	Boolean downWall,
	boolean restartTracking
) implements ModuleInput {}
