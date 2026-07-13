package ktanesolver.module.modded.regular.coloredsquares;

import ktanesolver.logic.ModuleOutput;

public record ColoredSquaresOutput(Group group) implements ModuleOutput {
	public enum Group {
		RED, BLUE, GREEN, YELLOW, MAGENTA, ROW, COLUMN
	}
}
