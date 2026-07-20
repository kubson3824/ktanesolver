package ktanesolver.module.modded.regular.gameoflife;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record GameOfLifeInput(List<Cell> cells, Boolean timerBelowHalf) implements ModuleInput {
	public enum Color { BLACK, WHITE, RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE, BROWN }

	public record Cell(Color first, Color second) {}
}
