package ktanesolver.module.modded.regular.binaryleds;

import ktanesolver.logic.ModuleOutput;

public record BinaryLedsOutput(
	int sequenceNumber,
	int red,
	int green,
	int blue,
	String recommendedColor,
	int recommendedValue
) implements ModuleOutput {
}
