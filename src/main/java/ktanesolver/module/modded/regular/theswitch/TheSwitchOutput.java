package ktanesolver.module.modded.regular.theswitch;

import ktanesolver.logic.ModuleOutput;

public record TheSwitchOutput(int stage, int timerDigit, SwitchPosition flipTo) implements ModuleOutput {}
