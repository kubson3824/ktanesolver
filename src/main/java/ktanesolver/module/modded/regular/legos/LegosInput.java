package ktanesolver.module.modded.regular.legos;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LegosInput(List<Piece> pieces, List<Connection> connections) implements ModuleInput {
	public enum Color { RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW }

	public record Piece(Color color, int width, int depth, boolean rotated) {
		int displayWidth() {
			return rotated ? depth : width;
		}

		int displayDepth() {
			return rotated ? width : depth;
		}
	}

	public record Connection(Color bottom, Color top, int offsetX, int offsetY) {}
}
