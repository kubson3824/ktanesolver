
package ktanesolver.module.vanilla.regular.simonsays;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SimonOutput(List<SimonColor> presses) implements ModuleOutput {
}
