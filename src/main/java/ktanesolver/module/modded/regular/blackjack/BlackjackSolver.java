package ktanesolver.module.modded.regular.blackjack;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.blackjack.BlackjackInput.StartingCard;

@Service
@ModuleInfo(
	type = ModuleType.BLACKJACK,
	id = "KritBlackjack",
	name = "Blackjack",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the hidden card and play the fixed blackjack deal.",
	tags = {"cards", "blackjack", "edgework", "staged"}
)
public class BlackjackSolver extends AbstractModuleSolver<BlackjackInput, BlackjackOutput> {
	private static final int[][] HITS = {{2,8},{6,7},{3,5},{1,10},{5,6},{10,1},{5,10},{9,1}};
	private static final int[][] DEALER = {{17,24,20},{15,17,16},{18,18,23},{20,26,19},{16,15,19},{15,15,16},{22,26,21},{13,14,19}};

	@Override
	protected SolveResult<BlackjackOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BlackjackInput input) {
		if (input == null || input.startingCard() == null) return failure("Select the visible starting card");
		Decision decision = hiddenCard(bomb, input.startingCard());
		storeState(module, Map.of(
			"blackjackStartingCard", input.startingCard().name(),
			"blackjackHiddenCard", decision.card(),
			"blackjackBet", decision.bet()
		));
		if (input.startingCard() == StartingCard.ACE_OF_SPADES && decision.value() == 10)
			return success(new BlackjackOutput(decision.card(), decision.bet(), List.of("check"), 21, null, null, false));
		if (input.extraCardValue() == null)
			return success(new BlackjackOutput(decision.card(), decision.bet(), List.of("bet " + decision.bet()), null, null, null, true), false);
		if (input.extraCardValue() < 1 || input.extraCardValue() > 6)
			return failure("The revealed extra card must be an ace or a value from 2 through 6");

		int order = dealOrder(decision.bet(), input.extraCardValue());
		Hand hand = new Hand(startingValue(input.startingCard()) + decision.value() + input.extraCardValue(),
			input.startingCard() == StartingCard.ACE_OF_SPADES);
		hand.softenIfNeeded();
		List<String> actions = new ArrayList<>();
		for (int hitCount = 0; hitCount <= 2; hitCount++) {
			int dealer = DEALER[order - 1][hitCount];
			if (hand.total <= 21 && (dealer > 21 || hand.total >= dealer || hand.total == 21)) {
				actions.add("stand");
				return success(new BlackjackOutput(decision.card(), decision.bet(), List.copyOf(actions), hand.total, dealer, order, false));
			}
			if (hitCount < 2) {
				hand.total += HITS[order - 1][hitCount];
				hand.softenIfNeeded();
				actions.add("hit");
			}
		}
		return failure("No safe play was found for this deal");
	}

	static Decision hiddenCard(BombEntity bomb, StartingCard startingCard) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		return switch (startingCard) {
			case ACE_OF_SPADES -> bomb.isIndicatorLit("BOB") ? new Decision("King of Hearts", 10, 100)
				: serial.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0) ? new Decision("Five of Diamonds", 5, 1)
				: serial.chars().filter(Character::isDigit).map(c -> c - '0').sum() > 7 ? new Decision("Seven of Spades", 7, 250)
				: new Decision("Two of Clubs", 2, 10);
			case KING_OF_DIAMONDS -> bomb.getIndicators().keySet().stream().map(String::toUpperCase)
				.anyMatch(label -> label.chars().anyMatch(c -> "GAMBLER".indexOf(c) >= 0)) ? new Decision("Queen of Hearts", 10, 250)
				: bomb.getDBatteryCount() > 1 ? new Decision("Nine of Spades", 9, 100)
				: bomb.hasPort(PortType.SERIAL) ? new Decision("Three of Diamonds", 3, 10)
				: new Decision("Four of Clubs", 4, 1);
			case TWO_OF_HEARTS -> totalPorts(bomb) > bomb.getBatteryCount() ? new Decision("Ace of Diamonds", 1, 100)
				: bomb.hasIndicator("NSA") ? new Decision("Three of Hearts", 3, 10)
				: bomb.getBatteryCount() == 0 ? new Decision("Seven of Clubs", 7, 250)
				: new Decision("Four of Spades", 4, 1);
			case TEN_OF_CLUBS -> serial.chars().anyMatch(c -> "CASINO".indexOf(c) >= 0) ? new Decision("Five of Clubs", 5, 100)
				: bomb.getAaBatteryCount() > 3 ? new Decision("Three of Hearts", 3, 1)
				: bomb.hasPort(PortType.PARALLEL) ? new Decision("Six of Diamonds", 6, 250)
				: new Decision("Ace of Spades", 1, 10);
		};
	}

	private static int dealOrder(int bet, int extraValue) {
		int column = switch (bet) { case 1 -> 1; case 10 -> 2; case 100 -> 3; default -> 4; };
		return column + (extraValue < 4 ? 0 : 4);
	}

	private static int startingValue(StartingCard card) {
		return switch (card) { case ACE_OF_SPADES -> 11; case TWO_OF_HEARTS -> 2; default -> 10; };
	}

	private static int totalPorts(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	static record Decision(String card, int value, int bet) {}
	private static final class Hand {
		private int total;
		private boolean softAce;
		private Hand(int total, boolean softAce) { this.total = total; this.softAce = softAce; }
		private void softenIfNeeded() { if (softAce && total > 21) { total -= 10; softAce = false; } }
	}
}
