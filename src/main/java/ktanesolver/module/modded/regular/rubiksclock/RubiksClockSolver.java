package ktanesolver.module.modded.regular.rubiksclock;

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
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.Action;
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.PinPosition;

@Service
@ModuleInfo(
	type = ModuleType.RUBIKS_CLOCK,
	id = "rubiksClock",
	name = "Rubik's Clock",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Follow the lit clock and pin instructions until every clock shows 12",
	tags = {"clock", "grid", "multi-stage", "edgework", "modded"}
)
public class RubiksClockSolver extends AbstractModuleSolver<RubiksClockInput, RubiksClockOutput> {
	private static final int[][][] MOVES = {
		{{0, 3, 2, 6}, {2, 3, 0, -2}, {1, 2, 1, 1}, {2, 3, 0, 4}, {0, 2, 2, -1}, {0, 1, 1, 5}, {2, 3, 1, 4}, {1, 2, 1, -1}, {2, 3, 2, -3}},
		{{0, 1, 3, 6}, {0, 1, 2, 6}, {0, 1, 0, 6}, {0, 2, 3, 1}, {0, 2, 3, -5}, {2, 3, 3, -4}, {2, 3, 3, 2}, {0, 3, 0, -5}, {1, 2, 3, 6}},
		{{0, 3, 2, -4}, {1, 2, 1, 4}, {1, 3, 3, -4}, {0, 2, 1, 5}, {1, 3, 0, 2}, {0, 3, 2, 2}, {1, 2, 2, 3}, {1, 3, 1, -2}, {1, 3, 1, 6}},
		{{0, 3, 3, 1}, {1, 2, 1, 3}, {0, 2, 0, -3}, {0, 1, 0, -3}, {1, 3, 2, 3}, {0, 2, 3, -5}, {1, 3, 2, 5}, {0, 3, 0, -2}, {0, 1, 0, -1}}
	};
	private static final PinPosition[] PINS = PinPosition.values();

	@Override
	protected SolveResult<RubiksClockOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, RubiksClockInput input
	) {
		if (input == null || input.action() == null) return failure("Choose a Rubik's Clock action");
		int step = ((Number) module.getState().getOrDefault("step", 0)).intValue();
		if (input.action() == Action.RESET) {
			module.getState().remove("step");
			return success(new RubiksClockOutput(List.of(), null, 0, 0), false);
		}
		if (input.action() == Action.COMPLETE) {
			if (step == 0) return failure("Calculate at least one instruction before marking the module complete");
			return success(new RubiksClockOutput(List.of(), null, 0, step));
		}
		if (input.litClock() == null || input.litPin() == null) return failure("Select the lit clock and lit pin");

		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().trim().toUpperCase(Locale.ROOT);
		if (serial.length() < 4 || !serial.substring(0, 4).matches("[A-Z0-9]{4}")) {
			return failure("The serial number must start with four letters or digits");
		}

		int[] rows = {
			(row(serial.charAt(0)) + step) % 12,
			(row(serial.charAt(1)) + step) % 12,
			(row(serial.charAt(2)) + step) % 12,
			(row(serial.charAt(3)) + step) % 12
		};
		int big = input.litClock().ordinal();
		int small = input.litPin().ordinal();
		for (int modification = 0; modification < 2; modification++) {
			int action = rows[modification * 2];
			int amount = amount(rows[modification * 2 + 1], bomb);
			int col = big % 3 * 2 + small % 2;
			int gridRow = big / 3 * 2 + small / 2;
			int distance = (action == 0 || action == 3 || action == 6 || action == 9) ? 2 : 1;
			if (action == 0 || action == 4) col = Math.floorMod(col + distance * amount, 6);
			else if (action == 1 || action == 9) gridRow = Math.floorMod(gridRow + distance * amount, 6);
			else if (action == 3 || action == 7) gridRow = Math.floorMod(gridRow - distance * amount, 6);
			else if (action == 6 || action == 10) col = Math.floorMod(col - distance * amount, 6);
			big = gridRow / 2 * 3 + col / 2;
			small = gridRow % 2 * 2 + col % 2;
		}

		int[] instruction = MOVES[small][big];
		int hours = instruction[3];
		for (int modification = 0; modification < 2; modification++) {
			int action = rows[modification * 2];
			int amount = amount(rows[modification * 2 + 1], bomb);
			if (action == 5 && amount % 2 == 1) hours = -hours;
		}
		for (int modification = 0; modification < 2; modification++) {
			int action = rows[modification * 2];
			int amount = amount(rows[modification * 2 + 1], bomb);
			if (action == 8) hours += amount;
			else if (action == 11) hours -= amount;
		}
		if (hours == 0) return failure("This lit clock and pin combination cannot occur on this step");

		boolean[] toggle = new boolean[4];
		toggle[instruction[0]] = true;
		toggle[instruction[1]] = true;
		for (int modification = 0; modification < 2; modification++) {
			if (rows[modification * 2] == 2 && amount(rows[modification * 2 + 1], bomb) % 2 == 0) {
				for (int pin = 0; pin < toggle.length; pin++) toggle[pin] = !toggle[pin];
			}
		}
		List<PinPosition> pins = new ArrayList<>(2);
		for (int pin = 0; pin < toggle.length; pin++) if (toggle[pin]) pins.add(PINS[pin]);

		RubiksClockOutput output = new RubiksClockOutput(List.copyOf(pins), PINS[instruction[2]], hours, step + 1);
		storeState(module, "step", step + 1);
		return success(output, false);
	}

	private static int row(char character) {
		int index = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".indexOf(character);
		return index < 0 ? -1 : index / 3;
	}

	private static int amount(int row, BombEntity bomb) {
		int lit = (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		return switch (row % 6) {
			case 0 -> bomb.getAaBatteryCount() + 1;
			case 1 -> lit + 1;
			case 2 -> bomb.getBatteryCount() + 1;
			case 3 -> bomb.getIndicators().size() - lit + 1;
			case 4 -> bomb.getDBatteryCount() + 1;
			default -> bomb.getIndicators().size() + 1;
		};
	}
}
