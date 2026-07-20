package ktanesolver.module.modded.regular.monsplodetradingcards;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MonsplodeTradingCardsInput(List<Card> hand, Card offer, Integer selectedCard) implements ModuleInput {
	public record Card(String name, String rarity, String printVersion, boolean foil, int bentCorners) {}
}
