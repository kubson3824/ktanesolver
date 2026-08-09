package ktanesolver.module.modded.regular.uncoloredsquares;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record UncoloredSquaresOutput(
	UncoloredSquaresColor firstColor,
	UncoloredSquaresColor otherColor,
	List<String> pattern,
	List<List<String>> placements,
	boolean willSolve
) implements ModuleOutput {}
