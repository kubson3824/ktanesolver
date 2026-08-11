package ktanesolver.module.modded.regular.quintuples;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record QuintuplesInput(List<Cell> cells) implements ModuleInput {
	public record Cell(int digit, Color color) {}
	public enum Color { RED, BLUE, ORANGE, GREEN, PINK }
}
