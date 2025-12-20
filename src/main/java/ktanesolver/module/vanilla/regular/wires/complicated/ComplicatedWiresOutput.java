
package ktanesolver.module.vanilla.regular.wires.complicated;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ComplicatedWiresOutput(List<Integer> cutWires) implements ModuleOutput {
}
