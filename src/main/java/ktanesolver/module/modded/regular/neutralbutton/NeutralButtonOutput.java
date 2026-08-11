package ktanesolver.module.modded.regular.neutralbutton;

import ktanesolver.logic.ModuleOutput;

public record NeutralButtonOutput(String action, int windowMilliseconds) implements ModuleOutput {}
