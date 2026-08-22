package ktanesolver.module.modded.regular.forgetthemall;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ForgetThemAllOutput(int finalValue, int keyStage, String keyModule, List<String> cutColors, String command) implements ModuleOutput {}
