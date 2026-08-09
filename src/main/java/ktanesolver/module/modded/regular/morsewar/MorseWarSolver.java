package ktanesolver.module.modded.regular.morsewar;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

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
	type = ModuleType.MORSE_WAR,
	id = "MorseWar",
	name = "Morse War",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use three LED rows and a transmitted code to identify four ships or submarines.",
	tags = {"morse", "leds", "ships", "submarines"}
)
public class MorseWarSolver extends AbstractModuleSolver<MorseWarInput, MorseWarOutput> {
	private static final List<String> PATTERNS = List.of("1100", "1010", "1001", "0110", "0101", "0011");
	private static final List<String> CODES = List.of(
		"ABR", "RBS", "SVR", "ZUX", "ZAQ", "MOI", "OPA", "VZQ",
		"XRP", "OLL", "AIR", "RHG", "MJN", "VTT", "XZS", "SUN"
	);
	private static final List<String> TABLES = List.of(
		"543214676583781472812361123458234567",
		"654325787614812583123472234561345678",
		"765436818725123614234583345672456781",
		"876547121836234725345614456783567812",
		"187658232147345836456725567814678123",
		"218761343258456147567836678125781234"
	);
	private static final List<String> FIRE = List.of(
		"SSSS", "USSS", "SUSS", "UUSS", "SSUS", "USUS", "SUUS", "UUUS",
		"SSSU", "USSU", "SUSU", "UUSU", "SSUU", "USUU", "SUUU", "UUUU"
	);

	@Override
	protected SolveResult<MorseWarOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MorseWarInput input
	) {
		if (input == null) return failure("Enter all three LED rows and the transmitted code");
		String top = pattern(input.topRow()), middle = pattern(input.middleRow()), bottom = pattern(input.bottomRow());
		String code = input.morseCode() == null ? "" : input.morseCode().trim().toUpperCase(Locale.ROOT);
		if (!PATTERNS.contains(top) || !PATTERNS.contains(middle) || !PATTERNS.contains(bottom)) {
			return failure("Each LED row must contain exactly two lit LEDs");
		}
		int word = CODES.indexOf(code);
		if (word < 0) return failure("Transmitted code is not listed in the manual");

		int tableNumber = TABLES.get(PATTERNS.indexOf(bottom)).charAt(
			PATTERNS.indexOf(top) * 6 + PATTERNS.indexOf(middle)) - '0';
		String answer = FIRE.get((word + tableNumber - 1) % FIRE.size());
		storeState(module, "morseCode", code);
		storeState(module, "bottomRow", bottom);
		storeState(module, "middleRow", middle);
		storeState(module, "topRow", top);
		return success(new MorseWarOutput(tableNumber,
			Arrays.stream(answer.split("")).toList()));
	}

	private static String pattern(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace('O', '0');
	}
}
