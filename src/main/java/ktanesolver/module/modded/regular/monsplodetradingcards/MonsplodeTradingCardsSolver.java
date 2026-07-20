package ktanesolver.module.modded.regular.monsplodetradingcards;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.monsplodetradingcards.MonsplodeTradingCardsInput.Card;

@Service
@ModuleInfo(
	type = ModuleType.MONSPLODE_TRADING_CARDS,
	id = "monsplodeCards",
	name = "Monsplode Trading Cards",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Value the three cards in hand and decide whether to keep them or trade the least valuable card.",
	tags = {"cards", "edgework", "multi-stage", "souvenir", "modded"}
)
public class MonsplodeTradingCardsSolver extends AbstractModuleSolver<MonsplodeTradingCardsInput, MonsplodeTradingCardsOutput> {
	private static final Pattern PRINT_VERSION = Pattern.compile("[A-I][1-9]");
	private static final Map<String, int[]> INITIAL_VALUES = initialValues();
	private static final Map<String, Double> RARITY_MULTIPLIERS = Map.of(
		"COMMON", 1d, "UNCOMMON", 1.25d, "RARE", 1.5d, "ULTRA_RARE", 1.75d
	);

	@Override
	protected SolveResult<MonsplodeTradingCardsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MonsplodeTradingCardsInput input
	) {
		if (input == null || input.hand() == null || input.hand().size() != 3 || input.offer() == null) {
			return failure("Enter exactly three hand cards and the offered card");
		}
		if (input.selectedCard() == null || input.selectedCard() < 1 || input.selectedCard() > 3) {
			return failure("Select the hand card currently displayed on the module");
		}
		if (bomb.getSerialNumber() == null || bomb.getSerialNumber().length() < 2) {
			return failure("The bomb serial number must contain at least two characters");
		}
		String validation = input.hand().stream().map(MonsplodeTradingCardsSolver::validationError)
			.filter(error -> error != null).findFirst().orElse(validationError(input.offer()));
		if (validation != null) return failure(validation);

		int stage = ((Number) module.getState().getOrDefault("stage", 0)).intValue() + 1;
		if (stage > 3) return failure("All three trade offers are already complete");
		List<Double> handValues = input.hand().stream().map(card -> cardValue(card, bomb)).toList();
		double offerValue = cardValue(input.offer(), bomb);
		double minimum = handValues.stream().mapToDouble(Double::doubleValue).min().orElseThrow();
		Integer tradeCard = offerValue >= minimum ? handValues.indexOf(minimum) + 1 : null;
		String action = tradeCard == null ? "KEEP" : "TRADE";

		storeState(module, "stage", stage);
		if (stage == 3) {
			storeState(module, "handBeforeFinalAction", input.hand());
			storeState(module, "souvenirCardNames", input.hand().stream().map(Card::name).toList());
			storeState(module, "souvenirPrintVersions", input.hand().stream().map(card -> normalize(card.printVersion())).toList());
		}
		return success(new MonsplodeTradingCardsOutput(
			action, tradeCard, input.selectedCard(), handValues, offerValue, stage
		), stage == 3);
	}

	private static String validationError(Card card) {
		if (card == null) return "Every card must be entered";
		if (card.name() == null || !INITIAL_VALUES.containsKey(normalize(card.name()))) return "Unknown Monsplode: " + card.name();
		if (card.rarity() == null || !RARITY_MULTIPLIERS.containsKey(normalize(card.rarity()))) return "Unknown card rarity: " + card.rarity();
		if (card.printVersion() == null || !PRINT_VERSION.matcher(normalize(card.printVersion())).matches()) {
			return "Print versions must be A1 through I9";
		}
		return card.bentCorners() < 0 || card.bentCorners() > 4 ? "Bent corner count must be between 0 and 4" : null;
	}

	private static double cardValue(Card card, BombEntity bomb) {
		String print = normalize(card.printVersion());
		char letter = print.charAt(0);
		int digit = print.charAt(1) - '0';
		if (letter - 'A' + 1 == digit) return 0;

		int value = INITIAL_VALUES.get(normalize(card.name()))[serialCategory(bomb.getSerialNumber())];
		for (Map.Entry<String, Boolean> indicator : bomb.getIndicators().entrySet()) {
			if (normalize(indicator.getKey()).indexOf(letter) >= 0) value += Boolean.TRUE.equals(indicator.getValue()) ? 1 : -1;
		}
		int batteries = bomb.getBatteryCount();
		if (batteries > 0) value += digit > batteries ? 1 : digit < batteries ? -1 : 2;
		double multiplier = RARITY_MULTIPLIERS.get(normalize(card.rarity())) + (card.foil() ? .5 : 0) - card.bentCorners() * .25;
		return Math.max(0, value * multiplier);
	}

	private static int serialCategory(String serial) {
		boolean firstLetter = Character.isLetter(serial.charAt(0));
		boolean secondLetter = Character.isLetter(serial.charAt(1));
		return firstLetter ? (secondLetter ? 0 : 1) : (secondLetter ? 2 : 3);
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
	}

	private static Map<String, int[]> initialValues() {
		Map<String, int[]> values = new LinkedHashMap<>();
		values.put("ALUGA", new int[]{2, 3, 4, 2}); values.put("ASTERAN", new int[]{2, 5, 2, 2});
		values.put("BOB", new int[]{2, 4, 2, 5}); values.put("BUHAR", new int[]{5, 2, 2, 3});
		values.put("CAADARIM", new int[]{2, 4, 3, 2}); values.put("CLONDAR", new int[]{3, 2, 4, 5});
		values.put("CUTIE_PIE", new int[]{2, 4, 2, 4}); values.put("DOCSPLODE", new int[]{2, 4, 2, 5});
		values.put("FLAURIM", new int[]{2, 3, 4, 2}); values.put("GLOORIM", new int[]{5, 2, 2, 2});
		values.put("LANALUFF", new int[]{2, 3, 4, 3}); values.put("LUGIRIT", new int[]{3, 3, 3, 2});
		values.put("MAGMY", new int[]{4, 3, 2, 3}); values.put("MELBOR", new int[]{2, 4, 4, 3});
		values.put("MOUNTOISE", new int[]{2, 4, 3, 3}); values.put("MYRCHAT", new int[]{2, 2, 4, 3});
		values.put("NIBS", new int[]{3, 3, 2, 4}); values.put("PERCY", new int[]{3, 3, 2, 4});
		values.put("POUSE", new int[]{2, 3, 3, 3}); values.put("UKKENS", new int[]{4, 2, 3, 3});
		values.put("VELLARIM", new int[]{4, 2, 3, 2}); values.put("VIOLAN", new int[]{3, 4, 2, 2});
		values.put("ZAPRA", new int[]{3, 4, 2, 3}); values.put("ZENLAD", new int[]{4, 2, 2, 4});
		values.put("ALUGA,_THE_FIGHTER", new int[]{6, 4, 5, 3}); values.put("BOB,_THE_ANCESTOR", new int[]{5, 6, 4, 4});
		values.put("BUHAR,_THE_PROTECTOR", new int[]{6, 5, 3, 4}); values.put("MELBOR,_THE_WEB_BUG", new int[]{4, 4, 4, 6});
		return Map.copyOf(values);
	}
}
