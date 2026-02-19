
package ktanesolver.module.modded.regular.logic;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LogicOutput(List<Boolean> answers) implements ModuleOutput {
}
