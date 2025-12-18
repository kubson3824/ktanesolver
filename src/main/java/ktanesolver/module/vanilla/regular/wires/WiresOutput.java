package ktanesolver.module.vanilla.regular.wires;

import ktanesolver.logic.ModuleOutput;

public record WiresOutput(int wirePosition, String instruction) implements ModuleOutput {
}
