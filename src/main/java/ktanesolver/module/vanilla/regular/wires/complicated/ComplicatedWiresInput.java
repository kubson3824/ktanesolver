
package ktanesolver.module.vanilla.regular.wires.complicated;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ComplicatedWiresInput(List<Wire> wires) implements ModuleInput {

	public record Wire(boolean red, boolean blue, boolean led, boolean star) {
	}
}
