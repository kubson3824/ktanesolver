package ktanesolver.module.modded.regular.fizzbuzz;

import java.util.List;
import java.util.Map;

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
import ktanesolver.module.modded.regular.fizzbuzz.FizzBuzzInput.Display;
import ktanesolver.module.modded.regular.fizzbuzz.FizzBuzzOutput.Action;

@Service
@ModuleInfo(
	type = ModuleType.FIZZ_BUZZ,
	id = "fizz_buzz",
	name = "FizzBuzz",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Alter three colored numbers and determine their FizzBuzz states",
	tags = {"numbers", "divisibility", "edgework", "modded"}
)
public class FizzBuzzSolver extends AbstractModuleSolver<FizzBuzzInput, FizzBuzzOutput> {
	private static final int[][] OFFSETS = {
		{7, 3, 2, 4, 5},
		{3, 4, 9, 2, 8},
		{4, 5, 8, 8, 2},
		{2, 3, 7, 9, 1},
		{6, 6, 1, 2, 8},
		{1, 2, 2, 5, 3},
		{3, 1, 8, 3, 4}
	};

	@Override
	protected SolveResult<FizzBuzzOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FizzBuzzInput input
	) {
		if (input == null || input.displays() == null || input.displays().size() != 3) {
			return failure("Enter the top, middle, and bottom displays");
		}
		if (input.displays().stream().anyMatch(display -> display == null || display.color() == null
			|| display.number() == null || !display.number().matches("\\d{7}"))) {
			return failure("Each display must have a color and exactly seven digits");
		}

		boolean[] conditions = conditions(bomb);
		List<Action> actions = input.displays().stream().map(display -> solve(display, conditions)).toList();
		storeState(module, Map.of(
			"input", input,
			"displayedNumbers", input.displays().stream().map(Display::number).toList(),
			"actions", actions.stream().map(Enum::name).toList()
		));
		return success(new FizzBuzzOutput(actions));
	}

	private static boolean[] conditions(BombEntity bomb) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber();
		return new boolean[] {
			bomb.getBatteryHolders() >= 3,
			bomb.hasPort(PortType.SERIAL) && bomb.hasPort(PortType.PARALLEL),
			serial.chars().filter(Character::isLetter).count() == 3
				&& serial.chars().filter(Character::isDigit).count() == 3,
			bomb.hasPort(PortType.DVI) && bomb.hasPort(PortType.STEREO_RCA),
			bomb.getStrikes() >= 2,
			bomb.getBatteryCount() >= 5
		};
	}

	private static Action solve(Display display, boolean[] conditions) {
		int shift = 0;
		boolean any = false;
		for (int row = 0; row < conditions.length; row++) {
			if (!conditions[row]) continue;
			shift += OFFSETS[row][display.color().ordinal()];
			any = true;
		}
		if (!any) shift = OFFSETS[6][display.color().ordinal()];

		int value = 0;
		for (int digit : display.number().chars().map(character -> character - '0').toArray()) {
			value = value * 10 + (digit + shift) % 10;
		}
		boolean fizz = value % 3 == 0;
		boolean buzz = value % 5 == 0;
		return fizz ? (buzz ? Action.FIZZBUZZ : Action.FIZZ) : (buzz ? Action.BUZZ : Action.NUMBER);
	}
}
