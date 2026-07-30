package ktanesolver.module.modded.regular.graffitinumbers;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GraffitiNumbersOutput(List<Integer> pressNumbers, List<Integer> buttonPositions)
	implements ModuleOutput {}
