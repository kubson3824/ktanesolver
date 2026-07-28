package ktanesolver.module.modded.regular.pie;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record PieOutput(int position, int x, int y, List<Integer> pressOrder) implements ModuleOutput {
}
