package ktanesolver.module.modded.regular.blackjack;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record BlackjackOutput(
	String hiddenCard,
	int bet,
	List<String> actions,
	Integer playerTotal,
	Integer dealerTotal,
	Integer dealOrder,
	boolean awaitingExtraCard
) implements ModuleOutput {}
