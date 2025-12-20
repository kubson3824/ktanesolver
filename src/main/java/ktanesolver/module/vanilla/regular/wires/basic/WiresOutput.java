
package ktanesolver.module.vanilla.regular.wires.basic;

import ktanesolver.logic.ModuleOutput;

public record WiresOutput(int wirePosition, String instruction) implements ModuleOutput {
}
