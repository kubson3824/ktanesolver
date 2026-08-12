package ktanesolver.module.modded.regular.poker;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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

@Service
@ModuleInfo(
	type = ModuleType.POKER,
	id = "Poker",
	name = "Poker",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Make the correct poker call, identify the opponent's bluff or truth, then choose a final card.",
	tags = {"cards", "poker", "edgework", "multi-stage"}
)
public class PokerSolver extends AbstractModuleSolver<PokerInput, PokerOutput> {
	private static final Set<String> STARTERS = Set.of(
		"ACE_OF_SPADES", "KING_OF_HEARTS", "FIVE_OF_DIAMONDS", "TWO_OF_CLUBS"
	);
	private static final Set<String> RESPONSES = Set.of(
		"TERRIBLE_PLAY", "AWFUL_PLAY", "REALLY", "REALLY_REALLY", "SURE_ABOUT_THAT", "ARE_YOU_SURE"
	);
	private static final Set<String> SUITS = Set.of("CLUB", "HEART", "SPADE", "DIAMOND");
	private static final Set<Integer> PRIME_DIGIT_SUMS = Set.of(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31);

	@Override
	protected SolveResult<PokerOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PokerInput input
	) {
		if (input == null || input.stage() < 1 || input.stage() > 3) return failure("Select stage 1, 2, or 3");
		Facts facts = facts(bomb);
		if (facts == null) return failure("Poker needs a valid six-character serial number containing a letter and a digit");
		return switch (input.stage()) {
			case 1 -> solveCall(module, input, facts);
			case 2 -> solveResponse(module, input);
			case 3 -> solveBet(module, input, facts);
			default -> throw new IllegalStateException();
		};
	}

	private SolveResult<PokerOutput> solveCall(ModuleEntity module, PokerInput input, Facts facts) {
		String starter = normalize(input.starterCard());
		if (!STARTERS.contains(starter)) return failure("Select the displayed starter card");
		String call = switch (starter) {
			case "ACE_OF_SPADES" -> aceCall(facts);
			case "KING_OF_HEARTS" -> kingCall(facts);
			case "FIVE_OF_DIAMONDS" -> fiveCall(facts);
			case "TWO_OF_CLUBS" -> twoCall(facts);
			default -> throw new IllegalStateException();
		};
		module.getState().clear();
		storeState(module, Map.of("starterCard", starter, "call", call));
		return success(new PokerOutput(1, call, null, null), false);
	}

	private SolveResult<PokerOutput> solveResponse(ModuleEntity module, PokerInput input) {
		String starter = state(module, "starterCard");
		String call = state(module, "call");
		if (starter == null || call == null) return failure("Solve stage 1 before entering the opponent response");
		String response = normalize(input.opponentResponse());
		if (!RESPONSES.contains(response)) return failure("Select the opponent's exact response");
		String truthOrBluff = isTruth(starter, response) ? "TRUTH" : "BLUFF";
		storeState(module, Map.of("opponentResponse", response, "truthOrBluff", truthOrBluff));
		return success(new PokerOutput(2, call, truthOrBluff, null), false);
	}

	private SolveResult<PokerOutput> solveBet(ModuleEntity module, PokerInput input, Facts facts) {
		String starter = state(module, "starterCard");
		String call = state(module, "call");
		String response = state(module, "opponentResponse");
		String truthOrBluff = state(module, "truthOrBluff");
		if (starter == null || call == null || response == null || truthOrBluff == null) {
			return failure("Solve stages 1 and 2 before entering the bet");
		}
		if (input.chipValue() == null || !Set.of(25, 50, 100, 500).contains(input.chipValue())) {
			return failure("Select the $25, $50, $100, or $500 chip");
		}
		List<String> cards = normalizeCards(input.finalCards());
		if (cards == null) return failure("Enter the suits of all four final cards from left to right");
		int position = switch (input.chipValue()) {
			case 25 -> cardFor25(starter, response, cards, facts);
			case 50 -> cardFor50(starter, response, cards, facts);
			case 100 -> cardFor100(starter, response, cards, facts);
			case 500 -> cardFor500(response, cards, facts);
			default -> throw new IllegalStateException();
		};
		storeState(module, Map.of("chipValue", input.chipValue(), "finalCards", cards));
		return success(new PokerOutput(3, call, truthOrBluff, position));
	}

	private static String aceCall(Facts f) {
		if (f.batteries() >= 3) {
			if (f.lit("FRK") || f.lit("BOB")) {
				if (f.digitSum() % 2 == 0) return f.port(PortType.RJ45) ? "ALL_IN" : "MAX_RAISE";
				return f.port(PortType.PS2) ? "MIN_RAISE" : "CHECK";
			}
			if (f.dBatteries() > f.aaBatteries()) return f.vowel() ? "FOLD" : "CHECK";
			return f.lastDigit() % 2 == 0 ? "MIN_RAISE" : "CHECK";
		}
		if (f.vowel()) {
			if (f.unlit("CAR")) return f.port(PortType.DVI) ? "ALL_IN" : "MAX_RAISE";
			return f.port(PortType.PARALLEL) ? "CHECK" : "MAX_RAISE";
		}
		if (f.port(PortType.SERIAL)) return f.unlit("SND") || f.unlit("TRN") ? "FOLD" : "CHECK";
		return f.lit("SIG") || f.lit("FRQ") ? "FOLD" : "CHECK";
	}

	private static String kingCall(Facts f) {
		if (f.digitSum() % 2 == 1) {
			if (f.batteries() >= 1) {
				if (f.lit("IND") || f.lit("MSA") || f.lit("TRN")) {
					return f.port(PortType.STEREO_RCA) ? "ALL_IN" : "MAX_RAISE";
				}
				return f.port(PortType.RJ45) && f.port(PortType.SERIAL) ? "CHECK" : "MAX_RAISE";
			}
			if (f.port(PortType.PS2) || f.port(PortType.DVI)) return f.lit("SND") ? "FOLD" : "CHECK";
			return "FOLD";
		}
		if (f.port(PortType.PARALLEL)) {
			if (f.aaBatteries() <= 3 && !f.unlit("MSA") && !f.lit("NSA")) return "MIN_RAISE";
			return "CHECK";
		}
		return (f.unlit("BOB") || f.unlit("FRQ")) && f.aaBatteries() > f.dBatteries() ? "CHECK" : "FOLD";
	}

	private static String fiveCall(Facts f) {
		if (f.dBatteries() < f.aaBatteries()) {
			if (f.vowel()) {
				if (f.ports() > 1) return f.unlit("CLR") || f.lit("CAR") ? "MIN_RAISE" : "FOLD";
				return f.lit("MSA") || f.unlit("NSA") ? "MIN_RAISE" : "CHECK";
			}
			if (f.port(PortType.PS2) || f.port(PortType.RJ45)) return f.unlitIndicators() > 0 ? "FOLD" : "CHECK";
			return f.unlit("CLR") ? "FOLD" : "CHECK";
		}
		if (f.lastDigit() % 2 == 1) {
			if (f.lit("BOB") || f.unlit("FRQ") || f.unlit("SIG")) return f.ports() > 0 ? "CHECK" : "MAX_RAISE";
			return f.port(PortType.PARALLEL) ? "MAX_RAISE" : "FOLD";
		}
		if (f.litIndicators() > 0) return f.ports() < 3 ? "ALL_IN" : "MIN_RAISE";
		return f.port(PortType.STEREO_RCA) && f.port(PortType.DVI) ? "MIN_RAISE" : "CHECK";
	}

	private static String twoCall(Facts f) {
		if (f.lit("TRN") || f.lit("BOB") || f.lit("IND")) {
			if (f.batteries() <= 5) {
				if (f.port(PortType.DVI) || f.port(PortType.STEREO_RCA)) return f.lastLetterVowel() ? "CHECK" : "FOLD";
				return "MAX_RAISE";
			}
			if (f.digitSum() >= 13) return f.port(PortType.PS2) && f.port(PortType.PARALLEL) ? "CHECK" : "MIN_RAISE";
			return "CHECK";
		}
		if (f.letterCount() % 2 == 0) {
			if (f.port(PortType.PARALLEL) && f.port(PortType.SERIAL)) {
				return f.aaBatteries() > f.dBatteries() ? "MIN_RAISE" : "CHECK";
			}
			return f.dBatteries() > f.aaBatteries() ? "MIN_RAISE" : "FOLD";
		}
		if (f.port(PortType.RJ45)) return f.dBatteries() > 2 ? "CHECK" : "MIN_RAISE";
		return f.batteries() > 2 ? "FOLD" : "CHECK";
	}

	private static boolean isTruth(String starter, String response) {
		return switch (starter) {
			case "ACE_OF_SPADES" -> Set.of("TERRIBLE_PLAY", "REALLY", "SURE_ABOUT_THAT").contains(response);
			case "KING_OF_HEARTS" -> Set.of("TERRIBLE_PLAY", "AWFUL_PLAY", "ARE_YOU_SURE").contains(response);
			case "FIVE_OF_DIAMONDS" -> Set.of("TERRIBLE_PLAY", "AWFUL_PLAY", "REALLY_REALLY", "ARE_YOU_SURE").contains(response);
			case "TWO_OF_CLUBS" -> Set.of("SURE_ABOUT_THAT", "ARE_YOU_SURE").contains(response);
			default -> false;
		};
	}

	private static int cardFor25(String starter, String response, List<String> c, Facts f) {
		if (red(c.get(0)) && f.lit("BOB")) return 4;
		if (response.equals("AWFUL_PLAY") && starter.equals("ACE_OF_SPADES")) return 1;
		if (f.unlit("FRQ") && black(c.get(3))) return 2;
		if (c.contains("DIAMOND") && (response.equals("REALLY") || response.equals("REALLY_REALLY"))) return 3;
		if (c.get(3).equals("SPADE") && f.batteries() > 4) return 3;
		if (c.get(2).equals("DIAMOND") && !c.get(1).equals("CLUB")) return 2;
		if (response.equals("ARE_YOU_SURE") && starter.equals("TWO_OF_CLUBS")) return 1;
		if (starter.equals("FIVE_OF_DIAMONDS")) return 4;
		if (c.get(1).equals("CLUB") && !f.port(PortType.RJ45)) return 2;
		return 1;
	}

	private static int cardFor50(String starter, String response, List<String> c, Facts f) {
		if (response.equals("SURE_ABOUT_THAT") && c.get(3).equals("HEART")) return 1;
		if (starter.equals("TWO_OF_CLUBS") && !c.contains("CLUB")) return 3;
		if (!c.contains("DIAMOND") && heartBeforeSpade(c)) return 4;
		if (c.get(0).equals("HEART") && !starter.equals("KING_OF_HEARTS")) return 2;
		if (response.equals("REALLY_REALLY") && (c.get(0).equals("HEART") || c.get(1).equals("HEART"))) return 4;
		if (starter.equals("FIVE_OF_DIAMONDS") && f.port(PortType.PARALLEL)) return 1;
		if (f.lit("TRN") && c.stream().anyMatch(PokerSolver::black)) return 2;
		if (response.equals("TERRIBLE_PLAY")) return 3;
		return f.digitSum() < 10 ? 1 : 3;
	}

	private static int cardFor100(String starter, String response, List<String> c, Facts f) {
		if (response.equals("REALLY_REALLY")) return 2;
		if (response.equals("REALLY")) return 4;
		if (f.dBatteries() == 0 && starter.equals("ACE_OF_SPADES")) return 1;
		if (PRIME_DIGIT_SUMS.contains(f.digitSum()) && c.contains("HEART")) return 4;
		if (response.equals("SURE_ABOUT_THAT") && c.contains("CLUB") && c.contains("SPADE")) return 3;
		if (hasAdjacentClubAndSpade(c)) return 2;
		if (f.unlit("MSA")) return 1;
		if (c.contains("DIAMOND")) return 3;
		if (response.equals("AWFUL_PLAY")) return 4;
		return 2;
	}

	private static int cardFor500(String response, List<String> c, Facts f) {
		if (c.stream().filter("CLUB"::equals).count() > 1) return 3;
		if (f.vowel() && c.contains("SPADE")) return 2;
		if (f.ports() == 0 && c.contains("HEART")) return 1;
		if (c.stream().noneMatch(PokerSolver::red)) return 4;
		if (response.equals("ARE_YOU_SURE")) return 4;
		if (f.litIndicators() == 0 && c.get(0).equals("HEART")) return 3;
		if (f.unlitIndicators() > 0 && c.get(1).equals("CLUB")) return 2;
		if (response.equals("REALLY") && c.stream().noneMatch(PokerSolver::black)) return 1;
		return f.dBatteries() > 1 ? 3 : 4;
	}

	private static boolean heartBeforeSpade(List<String> cards) {
		for (int heart = 0; heart < cards.size(); heart++) {
			if (!cards.get(heart).equals("HEART")) continue;
			for (int spade = heart + 1; spade < cards.size(); spade++) if (cards.get(spade).equals("SPADE")) return true;
		}
		return false;
	}

	private static boolean hasAdjacentClubAndSpade(List<String> cards) {
		for (int i = 0; i < cards.size() - 1; i++) {
			String first = cards.get(i);
			String second = cards.get(i + 1);
			if (first.equals("CLUB") && second.equals("SPADE") || first.equals("SPADE") && second.equals("CLUB")) return true;
		}
		return false;
	}

	private static boolean red(String suit) {
		return suit.equals("HEART") || suit.equals("DIAMOND");
	}

	private static boolean black(String suit) {
		return suit.equals("CLUB") || suit.equals("SPADE");
	}

	private static String normalize(String value) {
		return value == null ? null : value.trim().toUpperCase(Locale.ROOT);
	}

	private static List<String> normalizeCards(List<String> cards) {
		if (cards == null || cards.size() != 4) return null;
		List<String> normalized = cards.stream().map(PokerSolver::normalize).toList();
		return normalized.stream().allMatch(card -> card != null && SUITS.contains(card)) ? normalized : null;
	}

	private static String state(ModuleEntity module, String key) {
		Object value = module.getState().get(key);
		return value instanceof String string ? string : null;
	}

	private static Facts facts(BombEntity bomb) {
		if (bomb == null || bomb.getSerialNumber() == null) return null;
		String serial = bomb.getSerialNumber().trim().toUpperCase(Locale.ROOT);
		if (!serial.matches("[A-Z0-9]{6}") || serial.chars().noneMatch(Character::isLetter)
			|| serial.chars().noneMatch(Character::isDigit)) return null;
		int digitSum = serial.chars().filter(Character::isDigit).map(character -> character - '0').sum();
		int lastDigit = serial.chars().filter(Character::isDigit).map(character -> character - '0').reduce((a, b) -> b).orElseThrow();
		String letters = serial.replaceAll("[^A-Z]", "");
		int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts() == null ? 0 : plate.getPorts().size()).sum();
		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		return new Facts(
			bomb, digitSum, lastDigit, letters.length(), "AEIOU".indexOf(letters.charAt(letters.length() - 1)) >= 0,
			letters.chars().anyMatch(character -> "AEIOU".indexOf(character) >= 0), ports, (int)lit, (int)unlit
		);
	}

	private record Facts(
		BombEntity bomb,
		int digitSum,
		int lastDigit,
		int letterCount,
		boolean lastLetterVowel,
		boolean vowel,
		int ports,
		int litIndicators,
		int unlitIndicators
	) {
		private int aaBatteries() { return bomb.getAaBatteryCount(); }
		private int dBatteries() { return bomb.getDBatteryCount(); }
		private int batteries() { return bomb.getBatteryCount(); }
		private boolean port(PortType port) { return bomb.hasPort(port); }
		private boolean lit(String indicator) { return bomb.isIndicatorLit(indicator); }
		private boolean unlit(String indicator) { return bomb.isIndicatorUnlit(indicator); }
	}
}
