package ktanesolver.module.modded.regular.curriculum;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record CurriculumOutput(
	List<Integer> buttonStates,
	List<Integer> clicks,
	List<String> classes,
	List<Integer> classSections,
	String condition,
	boolean bookworm,
	int conflicts
) implements ModuleOutput {}
