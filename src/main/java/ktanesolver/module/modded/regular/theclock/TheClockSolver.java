package ktanesolver.module.modded.regular.theclock;

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
	type = ModuleType.THE_CLOCK,
	id = "the-clock",
	name = "The Clock",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Set the clock from its casing, numerals, hands, and timer",
	tags = {"clock", "time", "hands", "modded"}
)
public class TheClockSolver extends AbstractModuleSolver<TheClockInput, TheClockOutput> {
	private static final int DAY_MINUTES = 24 * 60;

	@Override
	protected SolveResult<TheClockOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheClockInput input) {
		if (input == null) return failure("Input is required");
		if (input.hour() == null || input.hour() < 1 || input.hour() > 12) return failure("Hour must be between 1 and 12");
		if (input.minute() == null || input.minute() < 0 || input.minute() > 59) return failure("Minute must be between 0 and 59");
		if (input.period() == null || input.numeralStyle() == null || input.casingColor() == null || input.colorsMatch() == null
			|| input.handStyle() == null || input.numeralColor() == null || input.amPmTextColor() == null
			|| input.secondsHandPresent() == null) {
			return failure("All clock features are required");
		}

		int offsetHours = (input.numeralStyle().ordinal() * 4
			+ (input.casingColor() == TheClockInput.CasingColor.GOLD ? 2 : 0)
			+ (input.colorsMatch() ? 0 : 1) + 2) % 12 + 1;
		int offsetMinutes = (input.handStyle().ordinal() * 20
			+ input.numeralColor().ordinal() * 4
			+ (input.amPmTextColor() == TheClockInput.TextColor.WHITE ? 2 : 0)
			+ (input.secondsHandPresent() ? 0 : 1) + 11) % 60;

		int initial = (input.hour() % 12 + (input.period() == TheClockInput.Period.PM ? 12 : 0)) * 60 + input.minute();
		int offset = offsetHours * 60 + offsetMinutes;

		storeState(module, "input", input);
		return success(new TheClockOutput(
			formatTime((initial + offset) % DAY_MINUTES),
			formatTime(Math.floorMod(initial - offset, DAY_MINUTES)),
			offsetHours,
			offsetMinutes
		));
	}

	private static String formatTime(int minutes) {
		int hour24 = minutes / 60;
		return "%d:%02d %s".formatted((hour24 + 11) % 12 + 1, minutes % 60, hour24 < 12 ? "AM" : "PM");
	}
}
