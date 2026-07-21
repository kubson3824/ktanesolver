package ktanesolver.module.modded.regular.visualimpairment;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record VisualImpairmentInput(
	List<Integer> shades,
	String desiredColor,
	boolean stageComplete,
	boolean moduleSolved
) implements ModuleInput {}
