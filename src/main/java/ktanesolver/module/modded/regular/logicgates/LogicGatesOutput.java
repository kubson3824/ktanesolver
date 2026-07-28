package ktanesolver.module.modded.regular.logicgates;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.logicgates.LogicGatesInput.Gate;

public record LogicGatesOutput(
	List<List<Gate>> candidates,
	List<Gate> gates,
	boolean readyToCheck
) implements ModuleOutput {}
