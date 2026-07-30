package ktanesolver.module.modded.regular.marbletumble;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MarbleTumbleOutput(
	List<Integer> timerDigits,
	String instruction
) implements ModuleOutput {}
