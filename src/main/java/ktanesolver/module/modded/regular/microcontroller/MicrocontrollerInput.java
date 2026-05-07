package ktanesolver.module.modded.regular.microcontroller;

import ktanesolver.logic.ModuleInput;

public record MicrocontrollerInput(
	MicrocontrollerType controllerType,
	int pinCount,
	String controllerSerialNumber
) implements ModuleInput {
}
