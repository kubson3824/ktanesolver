
package ktanesolver.module.modded.regular.logic;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record LogicInput(List<LogicRowInput> rows) implements ModuleInput {
}
