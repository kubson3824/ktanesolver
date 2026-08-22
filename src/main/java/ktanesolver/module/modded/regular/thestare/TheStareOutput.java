package ktanesolver.module.modded.regular.thestare;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TheStareOutput(String desiredState, boolean toggleNeeded, List<Integer> activeTimerDigits, String exampleTime, boolean confirm) implements ModuleOutput {}
