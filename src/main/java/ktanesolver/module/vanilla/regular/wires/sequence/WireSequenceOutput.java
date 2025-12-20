
package ktanesolver.module.vanilla.regular.wires.sequence;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record WireSequenceOutput(List<Boolean> cut) implements ModuleOutput {
}
