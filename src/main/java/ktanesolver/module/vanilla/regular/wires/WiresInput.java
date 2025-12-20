
package ktanesolver.module.vanilla.regular.wires;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record WiresInput(List<WireColor> wires) implements ModuleInput {
}
