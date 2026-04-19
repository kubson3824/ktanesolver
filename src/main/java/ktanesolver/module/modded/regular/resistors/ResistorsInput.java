package ktanesolver.module.modded.regular.resistors;

import ktanesolver.logic.ModuleInput;

public record ResistorsInput(
	ResistorsBands topResistor,
	ResistorsBands bottomResistor
) implements ModuleInput {
}
