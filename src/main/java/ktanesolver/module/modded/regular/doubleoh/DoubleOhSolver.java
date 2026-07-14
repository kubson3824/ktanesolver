package ktanesolver.module.modded.regular.doubleoh;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.doubleoh.DoubleOhInput.Button;

@Service
@ModuleInfo(
	type = ModuleType.DOUBLE_OH,
	id = "double-oh",
	name = "Double-Oh",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the scrambled controls and navigate the display to 00.",
	tags = { "numbers", "navigation", "grid", "modded" },
	hasInput = true,
	hasOutput = true
)
public class DoubleOhSolver extends AbstractModuleSolver<DoubleOhInput, DoubleOhOutput> {
	private static final int[] GRID = {
		60, 2, 15, 57, 36, 83, 48, 71, 24,
		88, 46, 31, 70, 22, 64, 7, 55, 13,
		74, 27, 53, 5, 41, 18, 86, 30, 62,
		52, 10, 4, 43, 85, 37, 61, 28, 76,
		33, 65, 78, 21, 0, 56, 12, 44, 87,
		47, 81, 26, 68, 14, 72, 50, 3, 35,
		6, 38, 42, 84, 63, 20, 75, 17, 51,
		25, 73, 67, 16, 58, 1, 34, 82, 40,
		11, 54, 80, 32, 77, 45, 23, 66, 8
	};
	private static final List<Group> ROUTE_ORDER = List.of(
		Group.LARGE_VERTICAL, Group.SMALL_VERTICAL, Group.LARGE_HORIZONTAL, Group.SMALL_HORIZONTAL);

	@Override
	protected SolveResult<DoubleOhOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, DoubleOhInput input) {
		if (input == null) return failure("Enter the displayed number and five cycle observations");
		if (input.displayedNumber() < 10) return failure("Cycle the buttons only from the original two-digit starting number");
		int start = positionOf(input.displayedNumber());
		if (start < 0) return failure("Displayed number is not in the Double-Oh grid");
		if (input.observations() == null || input.observations().size() != Button.values().length) {
			return failure("Enter one observation for every physical button");
		}

		Map<Group, Wiring> wiring = new EnumMap<>(Group.class);
		for (Button button : Button.values()) {
			Integer observedNumber = input.observations().get(button);
			int observed = observedNumber == null ? -1 : positionOf(observedNumber);
			Function function = observed < 0 ? null : inferFunction(start, observed);
			if (function == null) return failure("Observation for " + button + " is not one press from the displayed number");
			if (wiring.put(function.group, new Wiring(button, function)) != null) {
				return failure("Each button must reveal a different movement or submit function");
			}
		}
		if (wiring.size() != Group.values().length) {
			return failure("Observations must identify four movement functions and submit");
		}

		List<Button> presses = new ArrayList<>();
		int position = start;
		for (Group group : ROUTE_ORDER) {
			Wiring control = wiring.get(group);
			while (!atTarget(position, group)) {
				presses.add(control.button);
				position = control.function.move(position);
			}
		}
		presses.add(wiring.get(Group.SUBMIT).button);
		storeState(module, "input", input);
		return success(new DoubleOhOutput(presses));
	}

	private static Function inferFunction(int start, int observed) {
		for (Function function : Function.values()) if (function.move(start) == observed) return function;
		return null;
	}

	private static boolean atTarget(int position, Group group) {
		int x = position % 9;
		int y = position / 9;
		return switch (group) {
			case SMALL_VERTICAL -> y % 3 == 1;
			case SMALL_HORIZONTAL -> x % 3 == 1;
			case LARGE_VERTICAL -> y / 3 == 1;
			case LARGE_HORIZONTAL -> x / 3 == 1;
			case SUBMIT -> true;
		};
	}

	private static int positionOf(int number) {
		for (int i = 0; i < GRID.length; i++) if (GRID[i] == number) return i;
		return -1;
	}

	private enum Group { SMALL_VERTICAL, SMALL_HORIZONTAL, LARGE_VERTICAL, LARGE_HORIZONTAL, SUBMIT }
	private record Wiring(Button button, Function function) {}
	private enum Function {
		SMALL_UP(Group.SMALL_VERTICAL, 0, -1), SMALL_DOWN(Group.SMALL_VERTICAL, 0, 1),
		SMALL_LEFT(Group.SMALL_HORIZONTAL, -1, 0), SMALL_RIGHT(Group.SMALL_HORIZONTAL, 1, 0),
		LARGE_UP(Group.LARGE_VERTICAL, 0, -3), LARGE_DOWN(Group.LARGE_VERTICAL, 0, 3),
		LARGE_LEFT(Group.LARGE_HORIZONTAL, -3, 0), LARGE_RIGHT(Group.LARGE_HORIZONTAL, 3, 0),
		SUBMIT(Group.SUBMIT, 0, 0);

		private final Group group;
		private final int dx;
		private final int dy;

		Function(Group group, int dx, int dy) {
			this.group = group;
			this.dx = dx;
			this.dy = dy;
		}

		int move(int position) {
			int x = position % 9;
			int y = position / 9;
			if (group == Group.SMALL_HORIZONTAL) x = x / 3 * 3 + Math.floorMod(x % 3 + dx, 3);
			else if (group == Group.SMALL_VERTICAL) y = y / 3 * 3 + Math.floorMod(y % 3 + dy, 3);
			else {
				x = Math.floorMod(x + dx, 9);
				y = Math.floorMod(y + dy, 9);
			}
			return y * 9 + x;
		}
	}
}
