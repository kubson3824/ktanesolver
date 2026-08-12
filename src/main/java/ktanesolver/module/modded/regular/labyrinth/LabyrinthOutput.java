package ktanesolver.module.modded.regular.labyrinth;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record LabyrinthOutput(int nextLayer, List<Step> steps, List<List<String>> portals) implements ModuleOutput {
	public record Step(int layer, String phase, String start, String destination, List<String> directions) {}
}
