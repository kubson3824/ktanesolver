package ktanesolver.module.modded.regular.kudosudoku;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record KudosudokuOutput(
	List<Integer> solution,
	List<String> numberNames,
	String coordinate,
	Integer value,
	String coding,
	String submission,
	int remaining
) implements ModuleOutput {}
