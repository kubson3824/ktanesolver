package ktanesolver.module.modded.regular.polyhedralmaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PolyhedralMazeOutput(
	List<Integer> route,
	List<Integer> relativeDirections
) implements ModuleOutput {}
