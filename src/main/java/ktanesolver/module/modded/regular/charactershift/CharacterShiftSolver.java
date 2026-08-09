package ktanesolver.module.modded.regular.charactershift;

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
	type = ModuleType.CHARACTER_SHIFT,
	id = "characterShift",
	name = "Character Shift",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Shift four displayed letters by four displayed digits and match the serial number.",
	tags = {"letters", "digits", "serial", "sliders"}
)
public class CharacterShiftSolver extends AbstractModuleSolver<CharacterShiftInput, CharacterShiftOutput> {
	@Override
	protected SolveResult<CharacterShiftOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CharacterShiftInput input
	) {
		if (input == null || input.letters() == null || input.letters().size() != 4
			|| input.digits() == null || input.digits().size() != 4)
			return failure("Enter four letters and four digits");
		if (bomb.getSerialNumber() == null) return failure("Bomb serial number is required");
		List<String> letters = input.letters().stream()
			.map(value -> value == null ? "" : value.trim().toUpperCase(Locale.ROOT)).toList();
		if (letters.stream().anyMatch(value -> !value.matches("[A-Z]")) || new HashSet<>(letters).size() != 4)
			return failure("Displayed letters must be four distinct A–Z letters");
		if (input.digits().stream().anyMatch(value -> value == null || value < 0 || value > 9)
			|| new HashSet<>(input.digits()).size() != 4)
			return failure("Displayed digits must be four distinct digits 0–9");

		Set<Integer> serialLetters = new HashSet<>();
		bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().filter(Character::isLetter)
			.forEach(serialLetters::add);
		List<CharacterShiftSolution> solutions = new ArrayList<>();
		for (String letter : letters) for (int digit : input.digits()) {
			String shifted = String.valueOf(shift(bomb, digit, letter.charAt(0)));
			if (serialLetters.contains((int) shifted.charAt(0)))
				solutions.add(new CharacterShiftSolution(letter, digit, shifted));
		}
		if (solutions.isEmpty()) return failure("No displayed pair reaches a serial-number letter; check the observation");

		CharacterShiftSolution chosen = solutions.get(0);
		storeState(module, "unsubmittedLetters", letters.stream().filter(value -> !value.equals(chosen.letter())).toList());
		storeState(module, "unsubmittedDigits", input.digits().stream().filter(value -> value != chosen.digit()).map(String::valueOf).toList());
		return success(new CharacterShiftOutput(solutions, x(bomb), y(bomb)));
	}

	static char shift(BombEntity bomb, int digit, char letter) {
		int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		int unlit = bomb.getIndicators().size() - lit;
		int delta = switch (digit) {
			case 0 -> 3;
			case 1 -> x(bomb);
			case 2 -> -y(bomb);
			case 3 -> y(bomb) - bomb.getPortPlates().size();
			case 4 -> bomb.getLastDigit();
			case 5 -> -bomb.getBatteryHolders() + x(bomb) * 2;
			case 6 -> lit + y(bomb) - unlit;
			case 7 -> bomb.isIndicatorLit("SIG") ? x(bomb) : y(bomb);
			case 8 -> x(bomb) + y(bomb) - bomb.getIndicators().size() + bomb.getDBatteryCount();
			case 9 -> (bomb.getBatteryCount() > 3 ? x(bomb) : -x(bomb))
				+ (bomb.getIndicators().size() > 3 ? y(bomb) : -y(bomb));
			default -> throw new IllegalArgumentException("Digit must be 0–9");
		};
		return (char) ('A' + Math.floorMod(letter - 'A' + delta, 26));
	}

	private static int x(BombEntity bomb) {
		int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		long letters = bomb.getSerialNumber().chars().filter(Character::isLetter).count();
		return ports + (int) letters;
	}

	private static int y(BombEntity bomb) {
		long digits = bomb.getSerialNumber().chars().filter(Character::isDigit).count();
		return bomb.getIndicators().size() + (int) digits;
	}
}
