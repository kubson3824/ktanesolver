package ktanesolver.module.modded.regular.forgetthis;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ForgetThisInput(List<Stage> stages, List<Integer> implementationStages) implements ModuleInput {
    public record Stage(String digit, LedColor color) {}
    public enum LedColor { CYAN, MAGENTA, YELLOW, BLACK, WHITE }
}
