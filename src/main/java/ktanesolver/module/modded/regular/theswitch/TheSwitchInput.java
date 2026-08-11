package ktanesolver.module.modded.regular.theswitch;

import ktanesolver.logic.ModuleInput;

public record TheSwitchInput(SwitchPosition position, SwitchColor topColor, SwitchColor bottomColor, boolean restartAttempt) implements ModuleInput {}
