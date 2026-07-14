package ktanesolver.module.modded.regular.textfield;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TextFieldOutput(String tableName, List<Position> positions) implements ModuleOutput {
	public record Position(int column, int row) {}
}
