
package ktanesolver.module.modded.regular.switches;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SwitchesOutput(boolean solved, String instruction, List<Integer> solutionSteps // List of switch indices (1-5) to flip in order
) implements ModuleOutput {
}
