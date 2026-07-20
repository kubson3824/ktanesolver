package ktanesolver.module.modded.regular.coloredswitches;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ColoredSwitchesOutput(
	List<Integer> solutionSteps,
	boolean enterLedPositions,
	String instruction
) implements ModuleOutput {}
