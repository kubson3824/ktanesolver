package ktanesolver.module.modded.regular.simonsstar;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.simonsstar.SimonsStarInput.Color;

@Service
@ModuleInfo(
	type = ModuleType.SIMONS_STAR,
	id = "simonsStar",
	name = "Simon's Star",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the five colored flashes and central digits to build the response sequence.",
	tags = {"simon", "colors", "flashing", "stages"}
)
public class SimonsStarSolver extends AbstractModuleSolver<SimonsStarInput, SimonsStarOutput> {
	@Override
	protected SolveResult<SimonsStarOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonsStarInput input
	) {
		if (input == null || input.buttonColors() == null || input.flash() == null || input.digit() == null) {
			return failure("Enter the five button colors, current flash, and central digit");
		}
		List<Color> buttons = input.buttonColors();
		if (buttons.size() != 5 || buttons.stream().anyMatch(java.util.Objects::isNull)
			|| EnumSet.copyOf(buttons).size() != 5) {
			return failure("Enter each of the five button colors exactly once, clockwise from north");
		}
		if (input.digit() < 0 || input.digit() > 4) return failure("Central digit must be between 0 and 4");

		State state = module.getStateAs(State.class, State::empty);
		if (!state.buttonColors().isEmpty() && !state.buttonColors().equals(buttons)) {
			return failure("Button colors cannot change between stages");
		}
		int stage = state.presses().size() + 1;
		if (stage > 5) return failure("All five stages are already complete");

		List<Color> flashes = append(state.flashes(), input.flash());
		List<Integer> digits = append(state.digits(), input.digit());
		Color press = answer(buttons, flashes, digits, state.presses(), stage);
		List<Color> presses = append(state.presses(), press);
		module.setState(new State(List.copyOf(buttons), flashes, digits, presses));
		return success(new SimonsStarOutput(stage, presses), stage == 5);
	}

	static Color answer(List<Color> buttons, List<Color> flashes, List<Integer> digits, List<Color> presses, int stage) {
		Color flash = flashes.get(stage - 1);
		int digit = digits.get(stage - 1);
		return switch (stage) {
			case 1 -> switch (flash) {
				case RED -> move(buttons, Color.GREEN, 2);
				case BLUE -> move(buttons, Color.YELLOW, -digit);
				case YELLOW -> move(buttons, Color.PURPLE, digit);
				case GREEN -> move(buttons, Color.RED, -1);
				case PURPLE -> move(buttons, Color.BLUE, -2);
			};
			case 2 -> {
				Color firstFlash = flashes.get(0), firstPress = presses.get(0);
				if (flash == Color.GREEN && !List.of(Color.PURPLE, Color.RED).contains(firstFlash)) yield move(buttons, Color.BLUE, -digit);
				if (flash == Color.RED && !List.of(Color.GREEN, Color.BLUE).contains(firstPress)) yield move(buttons, Color.YELLOW, 3);
				if (flash == Color.BLUE && List.of(Color.PURPLE, Color.YELLOW).contains(firstPress)) yield Color.GREEN;
				if (flash == Color.YELLOW && firstFlash != Color.RED) yield move(buttons, Color.RED, -2);
				if (flash == Color.PURPLE && List.of(Color.GREEN, Color.RED).contains(firstFlash)) yield move(buttons, Color.PURPLE, digit);
				yield firstFlash;
			}
			case 3 -> {
				Color first = presses.get(0), second = presses.get(1);
				if (EnumSet.copyOf(flashes).size() == 3) yield move(buttons, Color.YELLOW, -digit);
				if (first != second) yield move(buttons, Color.BLUE, 2);
				if (!List.of(Color.GREEN, Color.PURPLE).contains(first) && !List.of(Color.GREEN, Color.PURPLE).contains(second)) yield move(buttons, Color.RED, digit);
				if (List.of(Color.BLUE, Color.RED).contains(flash)) yield move(buttons, Color.PURPLE, -1);
				yield first;
			}
			case 4 -> {
				if (presses.contains(move(buttons, flashes.get(2), digit))) yield presses.get(1);
				if (!presses.contains(move(buttons, flash, -2))) yield move(buttons, flashes.get(2), -digit);
				if (flashes.contains(move(buttons, presses.get(1), -digit))) yield flashes.get(0);
				if (!presses.contains(move(buttons, presses.get(0), 2))) yield move(buttons, presses.get(2), digit);
				yield flashes.get(1);
			}
			case 5 -> {
				if (EnumSet.copyOf(flashes).size() == 5) yield Color.GREEN;
				if (!presses.contains(Color.PURPLE)) yield Color.RED;
				if (!flashes.contains(Color.YELLOW)) yield Color.BLUE;
				if (!presses.contains(move(buttons, Color.RED, -digit))) yield Color.PURPLE;
				if (!flashes.contains(move(buttons, Color.BLUE, digit))) yield Color.YELLOW;
				if (flashes.contains(Color.GREEN) && presses.contains(Color.GREEN)) yield move(buttons, Color.RED, digit);
				yield move(buttons, Color.BLUE, -digit);
			}
			default -> throw new IllegalArgumentException("Stage must be between 1 and 5");
		};
	}

	private static Color move(List<Color> buttons, Color color, int spaces) {
		return buttons.get(Math.floorMod(buttons.indexOf(color) + spaces, buttons.size()));
	}

	private static <T> List<T> append(List<T> values, T value) {
		List<T> result = new ArrayList<>(values);
		result.add(value);
		return List.copyOf(result);
	}

	private record State(List<Color> buttonColors, List<Color> flashes, List<Integer> digits, List<Color> presses) {
		private static State empty() { return new State(List.of(), List.of(), List.of(), List.of()); }
	}
}
