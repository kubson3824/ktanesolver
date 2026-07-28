package ktanesolver.module.modded.regular.themoon;

import java.util.ArrayList;
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
	type = ModuleType.THE_MOON,
	id = "moon",
	name = "The Moon",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the compass-button sequence from the four lit sets and bomb edgework",
	tags = {"sequence", "edgework", "directions", "modded"}
)
public class TheMoonSolver extends AbstractModuleSolver<TheMoonInput, TheMoonOutput> {
	private static final String[] DIRECTIONS = {
		"north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"
	};

	@Override
	protected SolveResult<TheMoonOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheMoonInput input
	) {
		if (input.firstLitPosition() == null) return failure("Select the first lit set");

		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}")) {
			return failure("The bomb needs a valid six-character serial number");
		}
		serial = serial.toUpperCase(Locale.ROOT);

		int[] values = {
			bomb.getDBatteryCount(),
			(int)serial.chars().filter(Character::isLetter).filter(c -> "AEIOU".indexOf(c) < 0).count(),
			(int)serial.chars().filter(Character::isDigit).count(),
			bomb.getAaBatteryCount(),
			bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum(),
			bomb.getIndicators().size(),
			bomb.getModules().size(),
			bomb.getPortPlates().size()
		};

		String[] buttonBySet = new String[8];
		int firstLit = input.firstLitPosition().ordinal();
		for (int offset = 0; offset < 8; offset++) {
			int set = (firstLit + offset) % 8;
			int value = values[offset] % 7;
			buttonBySet[set] = value >= 5 ? "center"
				: (value < 3 ? "outer " : "inner ") + DIRECTIONS[set];
		}

		int serialDigitSum = serial.chars().filter(Character::isDigit).map(c -> c - '0').sum();
		int current = (firstLit + 4 + (3 + serialDigitSum) % 4) % 8;
		List<Integer> order = new ArrayList<>(8);
		boolean[] used = new boolean[8];
		order.add(current);
		used[current] = true;
		for (char character : serial.toCharArray()) {
			int value = Character.isDigit(character) ? character - '0' : character - 'A' + 1;
			int reversed = (value % 10) * 10 + value / 10;
			int direction = reversed % 7 < 4 ? 1 : -1;
			current = (current + 2 * direction + 8) % 8;
			while (used[current]) current = (current + direction + 8) % 8;
			order.add(current);
			used[current] = true;
		}
		for (int set = 0; set < 8; set++) if (!used[set]) order.add(set);

		List<String> presses = new ArrayList<>(8);
		for (int set : order) {
			String press = buttonBySet[set];
			presses.add(press);
			if (press.equals("center")) break;
		}
		return success(new TheMoonOutput(presses));
	}
}
