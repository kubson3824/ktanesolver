package ktanesolver.module.modded.regular.bamboozlingbutton;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BamboozlingButtonOutput(
	int stage,
	Timing timing,
	int firstValue,
	int secondValue,
	boolean doubleTap,
	String instruction,
	List<String> twitchCommands,
	int nextStage
) implements ModuleOutput {
	public enum Timing { LAST_DIGIT, LAST_TWO_DIGIT_SUM }
}
