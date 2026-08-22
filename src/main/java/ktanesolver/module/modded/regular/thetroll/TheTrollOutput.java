package ktanesolver.module.modded.regular.thetroll;

import ktanesolver.logic.ModuleOutput;

public record TheTrollOutput(int prepPresses, int additionalSolvesToActivate, int timerDigit, String prepCommand, String activationCommand) implements ModuleOutput {}
