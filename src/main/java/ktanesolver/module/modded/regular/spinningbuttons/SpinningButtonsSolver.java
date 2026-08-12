package ktanesolver.module.modded.regular.spinningbuttons;

import java.util.ArrayList;
import java.util.Comparator;
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
import ktanesolver.module.modded.regular.spinningbuttons.SpinningButtonsInput.Button;
import ktanesolver.module.modded.regular.spinningbuttons.SpinningButtonsOutput.ButtonResult;

@Service
@ModuleInfo(
	type = ModuleType.SPINNING_BUTTONS,
	id = "spinningButtons",
	name = "Spinning Buttons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Order four colored Cyrillic-character buttons by their manual table values.",
	tags = {"buttons", "colors", "characters", "ordering"}
)
public class SpinningButtonsSolver extends AbstractModuleSolver<SpinningButtonsInput, SpinningButtonsOutput> {
	static final List<String> COLORS = List.of("RED", "PURPLE", "ORANGE", "GREY", "GREEN", "BLUE");
	static final List<String> CHARACTERS = List.of("f", "l", "q", "w", "y", "d");

	@Override
	protected SolveResult<SpinningButtonsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SpinningButtonsInput input
	) {
		if (input == null || input.buttons() == null || input.buttons().size() != 4) {
			return failure("Enter exactly four buttons");
		}

		List<ButtonResult> buttons = new ArrayList<>(4);
		for (int position = 0; position < input.buttons().size(); position++) {
			Button button = input.buttons().get(position);
			String color = button == null || button.color() == null
				? "" : button.color().trim().toUpperCase(Locale.ROOT);
			String character = button == null || button.character() == null
				? "" : button.character().trim().toLowerCase(Locale.ROOT);
			if (!COLORS.contains(color) || !CHARACTERS.contains(character)) {
				return failure("Colors and characters must match the six options shown on the module");
			}
			buttons.add(new ButtonResult(position + 1, color, character, value(color, character)));
		}
		if (buttons.stream().map(ButtonResult::color).distinct().count() != 4
			|| buttons.stream().map(ButtonResult::character).distinct().count() != 4) {
			return failure("The four colors and four characters must each be unique");
		}

		buttons.sort(Comparator.comparingInt(ButtonResult::value));
		return success(new SpinningButtonsOutput(List.copyOf(buttons)));
	}

	static int value(String color, String character) {
		return COLORS.indexOf(color) + CHARACTERS.indexOf(character);
	}
}
