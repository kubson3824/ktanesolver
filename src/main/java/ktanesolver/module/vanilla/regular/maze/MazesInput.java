
package ktanesolver.module.vanilla.regular.maze;

import ktanesolver.logic.ModuleInput;

public record MazesInput(Cell marker1, Cell marker2, Cell start, Cell target) implements ModuleInput {
}
