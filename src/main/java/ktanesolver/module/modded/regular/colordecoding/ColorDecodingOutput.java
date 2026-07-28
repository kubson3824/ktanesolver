package ktanesolver.module.modded.regular.colordecoding;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ColorDecodingOutput(
	List<Selection> selections,
	int constraintSet
) implements ModuleOutput {
	public record Selection(Type type, int index) {
		public enum Type { ROW, COLUMN }
	}
}
