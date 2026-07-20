package ktanesolver.module.modded.regular.painting;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PaintingInput(List<Cell> cells) implements ModuleInput {
	public record Cell(String label, String color) {}
}
