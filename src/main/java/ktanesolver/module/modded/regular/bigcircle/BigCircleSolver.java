package ktanesolver.module.modded.regular.bigcircle;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.BIG_CIRCLE,
	id = "big-circle",
	name = "Big Circle",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate and press the three colors on the spinning circle",
	tags = {"colors", "circle", "edgework", "modded"}
)
public class BigCircleSolver extends AbstractModuleSolver<BigCircleInput, BigCircleOutput> {
	// ponytail: default rule seed only; add a rule-set input if non-default seeds need support.
	private static final String SERIAL_LOOKUP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	private static final Set<String> KNOWN_INDICATORS = Set.of("BOB", "CAR", "CLR", "FRK", "FRQ", "MSA", "NSA", "SIG", "SND", "TRN", "IND");
	private static final List<List<String>> COLOR_TABLE = List.of(
		List.of("RED", "YELLOW", "BLUE"),
		List.of("ORANGE", "GREEN", "MAGENTA"),
		List.of("BLUE", "BLACK", "RED"),
		List.of("MAGENTA", "WHITE", "ORANGE"),
		List.of("ORANGE", "BLUE", "BLACK"),
		List.of("GREEN", "RED", "WHITE"),
		List.of("MAGENTA", "YELLOW", "BLACK"),
		List.of("RED", "ORANGE", "YELLOW"),
		List.of("YELLOW", "GREEN", "BLUE"),
		List.of("BLUE", "MAGENTA", "RED"),
		List.of("BLACK", "WHITE", "GREEN"),
		List.of("WHITE", "YELLOW", "BLUE")
	);

	@Override
	protected SolveResult<BigCircleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BigCircleInput input
	) {
		if (input == null || input.spinDirection() == null) return failure("Select the circle's spin direction");
		String direction = input.spinDirection().trim().toUpperCase(Locale.ROOT);
		if (!Set.of("CLOCKWISE", "COUNTERCLOCKWISE").contains(direction)) {
			return failure("Spin direction must be clockwise or counterclockwise");
		}
		if (input.specialPortCount() < 0) return failure("Special port count cannot be negative");
		List<Integer> twoFactorCodes = input.twoFactorCodes() == null ? List.of() : input.twoFactorCodes();
		if (twoFactorCodes.stream().anyMatch(code -> code == null || code < 0 || code > 999999)) {
			return failure("Two Factor codes must be numbers from 0 to 999999");
		}
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().trim().toUpperCase(Locale.ROOT);
		if (serial.length() != 6 || serial.chars().anyMatch(character -> !Character.isLetterOrDigit(character))) {
			return failure("The bomb serial number must contain six letters and digits");
		}

		boolean counterclockwise = direction.equals("COUNTERCLOCKWISE");
		String souvenirDirection = counterclockwise ? "counterclockwise" : "clockwise";
		boolean bobException = bomb.getBatteryCount() == 5 && bomb.getBatteryHolders() == 3 && bomb.hasIndicator("BOB");
		Integer score = null;
		Integer serialIndex = null;
		char serialCharacter;
		if (bobException) {
			serialCharacter = serial.charAt(0);
		} else {
			score = Math.abs(indicatorScore(bomb)
				+ (bomb.getBatteryCount() % 2 == 1 ? 4 : -4)
				+ portScore(bomb)
				- input.specialPortCount() * 6
				+ BombEdgeworkUtils.countSolvedModules(bomb) * 3
				+ twoFactorCodes.stream().mapToInt(code -> code % 10).sum());
			serialIndex = bounceIndex(score, serial.length());
			serialCharacter = serial.charAt(serialIndex);
		}

		int lookupIndex = SERIAL_LOOKUP.indexOf(serialCharacter);
		if (lookupIndex < 0) return failure("The serial number contains an unsupported character");
		int tableIndex = lookupIndex / 3;
		List<String> pressSequence = new ArrayList<>(COLOR_TABLE.get(tableIndex));
		if (counterclockwise) java.util.Collections.reverse(pressSequence);
		storeState(module, "spinDirection", souvenirDirection);
		return success(new BigCircleOutput(
			score, serialIndex, String.valueOf(serialCharacter), List.copyOf(pressSequence), bobException, souvenirDirection
		));
	}

	private static int indicatorScore(BombEntity bomb) {
		int score = 0;
		for (Map.Entry<String, Boolean> indicator : bomb.getIndicators().entrySet()) {
			String label = indicator.getKey().toUpperCase(Locale.ROOT);
			boolean lit = Boolean.TRUE.equals(indicator.getValue());
			score += switch (label) {
				case "BOB", "CAR", "CLR" -> lit ? 1 : -1;
				case "FRK", "FRQ", "MSA", "NSA" -> lit ? 2 : -2;
				case "SIG", "SND", "TRN" -> lit ? 3 : -3;
				default -> KNOWN_INDICATORS.contains(label) ? 0 : 6;
			};
		}
		return score;
	}

	private static int portScore(BombEntity bomb) {
		int score = 0;
		for (PortPlateEntity plate : bomb.getPortPlates()) {
			Set<PortType> ports = plate.getPorts();
			if (ports.contains(PortType.PARALLEL)) score += ports.contains(PortType.SERIAL) ? -4 : 5;
			if (ports.contains(PortType.DVI)) score += ports.contains(PortType.STEREO_RCA) ? 4 : -5;
		}
		return score;
	}

	private static int bounceIndex(int steps, int length) {
		int period = (length - 1) * 2;
		int position = steps % period;
		return position < length ? position : period - position;
	}
}
