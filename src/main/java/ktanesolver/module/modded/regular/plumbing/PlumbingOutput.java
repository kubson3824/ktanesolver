
package ktanesolver.module.modded.regular.plumbing;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

/**
 * Which of the 4 input pipes (left) and 4 output pipes (right) are active.
 * Order: Red, Yellow, Green, Blue.
 */
public record PlumbingOutput(
	List<Boolean> activeInputs,
	List<Boolean> activeOutputs
) implements ModuleOutput {
}
