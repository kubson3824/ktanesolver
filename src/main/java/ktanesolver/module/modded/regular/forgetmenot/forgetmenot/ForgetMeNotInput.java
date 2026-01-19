package ktanesolver.module.modded.regular.forgetmenot.forgetmenot;

import ktanesolver.logic.ModuleInput;

public record ForgetMeNotInput(int display, int stage, boolean allModulesCompleted) implements ModuleInput {
}
