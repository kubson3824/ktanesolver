package ktanesolver.module.vanilla.regular.wires;

import ktanesolver.logic.ModuleInput;

import java.util.List;

public record WiresInput(List<WireColor> wires) implements ModuleInput {
}
