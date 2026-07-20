package ktanesolver.module.modded.regular.monsplodetradingcards;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MonsplodeTradingCardsOutput(
	String action, Integer tradeCard, int selectedCard, List<Double> handValues, double offerValue, int stage
) implements ModuleOutput {}
