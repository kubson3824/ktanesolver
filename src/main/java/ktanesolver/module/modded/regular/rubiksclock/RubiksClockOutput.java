package ktanesolver.module.modded.regular.rubiksclock;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.PinPosition;

public record RubiksClockOutput(List<PinPosition> pins, PinPosition gear, int hours, int step) implements ModuleOutput {}
