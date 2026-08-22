package ktanesolver.module.modded.regular.forgetthemall;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ForgetThemAllInput(int startingBombMinutes, List<Stage> stages, List<String> alreadyCutColors) implements ModuleInput {
    public record Stage(String moduleName, List<String> litLeds) {}
}
