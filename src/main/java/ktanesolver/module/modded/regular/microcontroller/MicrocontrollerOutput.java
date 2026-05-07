package ktanesolver.module.modded.regular.microcontroller;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MicrocontrollerOutput(
	List<MicrocontrollerPinSolution> pins,
	String colorRule
) implements ModuleOutput {
}
