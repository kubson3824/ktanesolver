package ktanesolver.module.modded.regular.thesun;

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
	type = ModuleType.THE_SUN,
	id = "sun",
	name = "The Sun",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the eight compass buttons from the LED and bomb edgework",
	tags = {"sequence", "edgework", "directions", "modded"}
)
public class TheSunSolver extends AbstractModuleSolver<TheSunInput, TheSunOutput> {
	private static final String[] DIRECTIONS = {
		"north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"
	};

	@Override
	protected SolveResult<TheSunOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheSunInput input
	) {
		if (input.ledPosition() == null) return failure("Select the LED position");

		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}")) {
			return failure("The bomb needs a valid six-character serial number");
		}
		serial = serial.toUpperCase(Locale.ROOT);

		int moduleCount = bomb.getModules().size();
		int[] values = {
			bomb.getIndicators().size(),
			(int)serial.chars().filter(Character::isLetter).filter(c -> "AEIOU".indexOf(c) < 0).count(),
			bomb.getBatteryCount(),
			(int)serial.chars().filter(Character::isDigit).count(),
			bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum(),
			moduleCount,
			bomb.getBatteryHolders(),
			bomb.getPortPlates().size()
		};

		String[] buttonBySet = new String[8];
		int led = input.ledPosition().ordinal();
		for (int offset = 0; offset < 8; offset++) {
			int set = (led + offset) % 8;
			int value = values[offset] % 7;
			buttonBySet[set] = value >= 5 ? "center"
				: (value < 2 ? "outer " : "inner ") + DIRECTIONS[set];
		}

		List<Integer> order = new ArrayList<>(8);
		boolean[] used = new boolean[8];
		int current = moduleCount % 8;
		order.add(current);
		used[current] = true;
		for (char character : serial.toCharArray()) {
			int step = (Character.isDigit(character) ? character - '0' : character - 'A' + 1) % 10 < 5 ? -1 : 1;
			do current = (current + step + 8) % 8; while (used[current]);
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
		return success(new TheSunOutput(presses));
	}
}
