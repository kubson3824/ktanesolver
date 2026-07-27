package ktanesolver.module.modded.regular.rubiksclock;

import ktanesolver.logic.ModuleInput;

public record RubiksClockInput(Action action, ClockPosition litClock, PinPosition litPin) implements ModuleInput {
	public enum Action { SOLVE_STEP, RESET, COMPLETE }
	public enum ClockPosition { TL, T, TR, L, C, R, BL, B, BR }
	public enum PinPosition { TL, TR, BL, BR }
}
