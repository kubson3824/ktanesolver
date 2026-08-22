package ktanesolver.module.modded.regular.forgetthis;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ForgetThisOutput(String answer, int decimalAnswer, List<Step> steps) implements ModuleOutput {
    public record Step(int stage, int before, String operation, int after) {}
}
