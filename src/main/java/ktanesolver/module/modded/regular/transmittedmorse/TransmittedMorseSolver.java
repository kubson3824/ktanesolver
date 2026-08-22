package ktanesolver.module.modded.regular.transmittedmorse;

import java.util.ArrayList;
import java.util.LinkedHashSet;
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
	type = ModuleType.TRANSMITTED_MORSE,
	id = "transmittedMorseModule",
	name = "Transmitted Morse",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Transform each received Morse message into its ordered slider entries across two stages.",
	tags = {"morse", "sliders", "colors", "multi-stage", "souvenir"}
)
public class TransmittedMorseSolver extends AbstractModuleSolver<TransmittedMorseInput, TransmittedMorseOutput> {
	private static final Set<String> TABLE_MESSAGES = Set.of(
		"BOMBS","SHORT","UNDERSTOOD","W1RES","SOS","MANUAL","STRIKED","WEREDEAD","GOTASOUV","EXPLOSION","EXPERT","RIP","LISTEN","DETONATE","ROGER","WELOSTBRO","AMIDEAF","KEYPAD","DEFUSER","NUCLEARWEAPONS","KAPPA","DELTA","PI3","SMOKE","SENDHELP","LOST","SWAN","NOMNOM","BLUE","BOOM","CANCEL","DEFUSED","BROKEN","MEMORY","R6S8T","TRANSMISSION","UMWHAT","GREEN","EQUATIONSX");
	private static final Set<String> RAW_MESSAGES;
	private static final Set<String> COLORS = Set.of("YELLOW","BLUE","RED","GREEN","PINK","ORANGE","WHITE");
	static { LinkedHashSet<String> messages = new LinkedHashSet<>(TABLE_MESSAGES); messages.addAll(List.of("RED","ENERGY","JESTER","CONTACT","LONG")); RAW_MESSAGES = Set.copyOf(messages); }

	@Override
	protected SolveResult<TransmittedMorseOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TransmittedMorseInput input) {
		if (input == null || input.receivedMessage() == null || input.topLed() == null || input.bottomLed() == null) return failure("Enter the received message and both LED colors");
		String received = input.receivedMessage().replaceAll("\\s", "").toUpperCase(Locale.ROOT);
		String top = input.topLed().trim().toUpperCase(Locale.ROOT), bottom = input.bottomLed().trim().toUpperCase(Locale.ROOT);
		if (!RAW_MESSAGES.contains(received) || !COLORS.contains(top) || !COLORS.contains(bottom)) return failure("The received message or LED color is not one the module can display");
		int stage = module.getState().get("transmittedMorseNextStage") instanceof Number value ? value.intValue() : 1;
		if (stage < 1 || stage > 2) return failure("The saved Transmitted Morse stage is invalid");
		String effective = TABLE_MESSAGES.contains(received) ? received : "AEIOU".indexOf(received.charAt(0)) >= 0 ? "CODERED" : "UNLUCKY";
		boolean reversed = (top.equals("RED") || top.equals("PINK")) && (bottom.equals("YELLOW") || bottom.equals("BLUE"));
		if (reversed) effective = new StringBuilder(effective).reverse().toString();
		List<TransmittedMorseOutput.Entry> entries = effective.chars().mapToObj(character -> entry((char) character, top, bottom)).toList();

		List<String> messages = new ArrayList<>();
		Object saved = module.getState().get("transmittedMorseMessages");
		if (saved instanceof List<?> list) list.forEach(value -> messages.add(String.valueOf(value)));
		while (messages.size() < stage) messages.add("");
		messages.set(stage - 1, received);
		storeState(module, "transmittedMorseMessages", List.copyOf(messages));
		storeState(module, "transmittedMorseNextStage", Math.min(2, stage + 1));
		TransmittedMorseOutput output = new TransmittedMorseOutput(stage, received, effective, reversed, entries, Math.min(2, stage + 1));
		return stage == 2 ? success(output) : success(output, false);
	}

	private static TransmittedMorseOutput.Entry entry(char character, String top, String bottom) {
		int value = Character.isDigit(character) ? character - '0' : character - 'A' + 1;
		int position = value > 20 ? value % 10 : value;
		int slider;
		if (top.equals("ORANGE") || top.equals("WHITE")) slider = Character.isDigit(character) || value >= 14 ? 1 : value <= 7 ? 2 : 3;
		else if (bottom.equals("YELLOW") || bottom.equals("ORANGE")) slider = Character.isDigit(character) ? 2 : value <= 7 ? 1 : value <= 13 ? 2 : 3;
		else slider = Character.isDigit(character) ? 3 : value <= 7 ? 3 : value <= 13 ? 2 : 1;
		return new TransmittedMorseOutput.Entry(slider, position);
	}
}
