package ktanesolver.module.modded.regular.threedmaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

/**
 * Output for the 3D Maze module: goal cell and direction; when current position was provided, also the move sequence.
 * phase: "go_to_star" when we are guiding to the nearest direction marker (user then reports N/S/E/W); "go_to_goal" when guiding to the goal wall.
 * maze: included when a path is returned, for UI display of the finished maze grid.
 */
public record ThreeDMazeOutput(
	int goalRow,
	int goalCol,
	String goalDirection,
	List<ThreeDMazeMove> moves,
	Integer startRow,
	Integer startCol,
	String startFacing,
	String phase,
	String message,
	ThreeDMazeMaze maze
) implements ModuleOutput {

	public ThreeDMazeOutput(int goalRow, int goalCol, String goalDirection) {
		this(goalRow, goalCol, goalDirection, null, null, null, null, null, null, null);
	}

	public ThreeDMazeOutput(int goalRow, int goalCol, String goalDirection, List<ThreeDMazeMove> moves, Integer startRow, Integer startCol, String startFacing) {
		this(goalRow, goalCol, goalDirection, moves, startRow, startCol, startFacing, null, null, null);
	}
}
