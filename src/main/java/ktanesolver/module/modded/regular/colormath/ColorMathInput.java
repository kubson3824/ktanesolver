package ktanesolver.module.modded.regular.colormath;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ColorMathInput(
	List<String> leftColors,
	List<String> rightColors,
	String displayColor,
	String operation
) implements ModuleInput {
}
