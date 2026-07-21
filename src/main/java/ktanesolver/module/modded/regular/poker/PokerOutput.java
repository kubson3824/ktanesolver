package ktanesolver.module.modded.regular.poker;

import ktanesolver.logic.ModuleOutput;

public record PokerOutput(
	int stage,
	String call,
	String truthOrBluff,
	Integer cardPosition
) implements ModuleOutput {}
