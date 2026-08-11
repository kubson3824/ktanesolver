package ktanesolver.module.modded.regular.reversemorse;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ReverseMorseOutput(
	String firstMessage,
	String secondMessage,
	List<String> firstTransmission,
	List<String> secondTransmission,
	int currentStage
) implements ModuleOutput {}
