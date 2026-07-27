package ktanesolver.module.modded.regular.pressx;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PressXOutput(
	String button,
	String timing,
	List<Integer> validSeconds,
	boolean anyTime,
	String instruction
) implements ModuleOutput {}
