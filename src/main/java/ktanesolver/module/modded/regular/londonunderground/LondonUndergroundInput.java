package ktanesolver.module.modded.regular.londonunderground;

import ktanesolver.logic.ModuleInput;

public record LondonUndergroundInput(Action action, String departure, String destination) implements ModuleInput {
	public enum Action { SOLVE_STAGE, RESET }
}
