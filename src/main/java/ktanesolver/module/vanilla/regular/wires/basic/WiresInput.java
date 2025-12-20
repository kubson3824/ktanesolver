
package ktanesolver.module.vanilla.regular.wires.basic;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record WiresInput(List<WireColor> wires) implements ModuleInput {
}
