package ktanesolver.module.modded.regular.poker;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PokerInput(
	int stage,
	String starterCard,
	String opponentResponse,
	Integer chipValue,
	List<String> finalCards
) implements ModuleInput {}
