package ktanesolver.module.modded.regular.polyhedralmaze;

import ktanesolver.logic.ModuleInput;

public record PolyhedralMazeInput(
	String polyhedron,
	Integer startFace,
	Integer destinationFace
) implements ModuleInput {}
