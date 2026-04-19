package ktanesolver.module.modded.regular.resistors;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ResistorsOutput(
	ResistorsPin primaryInput,
	ResistorsPin primaryOutput,
	ResistorsPin secondaryInput,
	ResistorsPin secondaryOutput,
	long targetResistanceOhms,
	double topResistanceOhms,
	double bottomResistanceOhms,
	List<ResistorsConnection> requiredConnections,
	String instruction
) implements ModuleOutput {
}
