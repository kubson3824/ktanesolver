package ktanesolver.module.modded.regular.blackjack;

import ktanesolver.logic.ModuleInput;

public record BlackjackInput(StartingCard startingCard, Integer extraCardValue) implements ModuleInput {
	public enum StartingCard { ACE_OF_SPADES, KING_OF_DIAMONDS, TWO_OF_HEARTS, TEN_OF_CLUBS }
}
