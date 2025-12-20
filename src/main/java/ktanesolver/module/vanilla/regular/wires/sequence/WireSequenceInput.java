
package ktanesolver.module.vanilla.regular.wires.sequence;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record WireSequenceInput(List<WireSequenceCombo> wires, int stage) implements ModuleInput {

}
