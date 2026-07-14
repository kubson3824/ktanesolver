package ktanesolver.module.modded.regular.pointoforder;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.POINT_OF_ORDER,
	id = "point-of-order",
	name = "Point of Order",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Infer the two active Mao rules and identify every card that can be played.",
	tags = {"cards", "Mao", "serial number", "logic"}
)
public class PointOfOrderSolver extends AbstractModuleSolver<PointOfOrderInput, PointOfOrderOutput> {
	private static final List<String> RANKS = List.of("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");
	private static final String SUITS = "SHCD";
	private static final String[] SUIT_RULES = {"32;03;10;21", "12;23;30;01", "03;10;21;32", "01;12;23;30"};

	@Override
	protected SolveResult<PointOfOrderOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PointOfOrderInput input
	) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (serial.length() != 6 || !Character.isLetterOrDigit(serial.charAt(0)) || !Character.isLetterOrDigit(serial.charAt(1))
			|| !Character.isLetter(serial.charAt(3)) || !Character.isLetter(serial.charAt(4))) {
			return failure("Point of Order needs a valid serial number with letters in positions 4 and 5");
		}
		if (input == null || input.cards() == null || input.cards().size() != 5) {
			return failure("Enter the five played cards from oldest to newest");
		}

		List<Card> pile = new ArrayList<>(5);
		for (String value : input.cards()) {
			Card card = parse(value);
			if (card == null) return failure("Cards must use ranks A–K and suits S, H, C, or D");
			pile.add(card);
		}
		if (new HashSet<>(pile).size() != pile.size()) return failure("Each played card must be different");

		List<Integer> activeRules = new ArrayList<>(2);
		for (int rule = 1; rule <= 3; rule++) {
			boolean active = true;
			for (int card = 1; card < pile.size() && active; card++) {
				active = matches(rule, pile.get(card - 1), pile.get(card), serial);
			}
			if (active) activeRules.add(rule);
		}
		if (activeRules.size() != 2) return failure("These cards do not identify exactly two active rules; check their order");

		Set<Card> played = Set.copyOf(pile);
		Card top = pile.getLast();
		List<Card> valid = new ArrayList<>();
		for (int rank = 1; rank <= 13; rank++) for (int suit = 0; suit < 4; suit++) {
			Card card = new Card(rank, suit);
			if (!played.contains(card) && activeRules.stream().allMatch(rule -> matches(rule, top, card, serial))) valid.add(card);
		}
		if (valid.isEmpty()) return failure("These cards leave no legal play; check their order");

		List<String> normalizedPile = pile.stream().map(Card::label).toList();
		storeState(module, "input", new PointOfOrderInput(normalizedPile));
		storeState(module, "activeRules", List.copyOf(activeRules));
		return success(new PointOfOrderOutput(List.copyOf(activeRules), valid.stream().map(Card::label).toList()));
	}

	private static boolean matches(int rule, Card previous, Card next, String serial) {
		if (rule == 1) {
			int serialType = (Character.isLetter(serial.charAt(0)) ? 2 : 0) + (Character.isLetter(serial.charAt(1)) ? 1 : 0);
			String allowed = SUIT_RULES[serialType].substring(previous.suit() * 3, previous.suit() * 3 + 2);
			return allowed.indexOf('0' + next.suit()) >= 0;
		}
		if (rule == 2) {
			int divisor = (serial.charAt(3) - 'A' + 1) % 3 + 3;
			return (previous.rank() % divisor == 0) != (next.rank() % divisor == 0);
		}
		int difference = (serial.charAt(4) - 'A' + 1) % 3 + 2;
		int distance = Math.abs(previous.rank() - next.rank());
		distance = Math.min(distance, 13 - distance);
		return distance == difference || distance == difference + 1;
	}

	private static Card parse(String value) {
		if (value == null) return null;
		String normalized = value.trim().toUpperCase(Locale.ROOT);
		if (normalized.length() < 2) return null;
		int rank = RANKS.indexOf(normalized.substring(0, normalized.length() - 1)) + 1;
		int suit = SUITS.indexOf(normalized.charAt(normalized.length() - 1));
		return rank == 0 || suit < 0 ? null : new Card(rank, suit);
	}

	private record Card(int rank, int suit) {
		private String label() {
			return RANKS.get(rank - 1) + SUITS.charAt(suit);
		}
	}
}
