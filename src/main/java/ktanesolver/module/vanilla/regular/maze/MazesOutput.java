
package ktanesolver.module.vanilla.regular.maze;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record MazesOutput(List<Move> moves) implements ModuleOutput {
}
