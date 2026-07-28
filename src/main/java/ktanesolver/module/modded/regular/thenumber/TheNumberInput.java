package ktanesolver.module.modded.regular.thenumber;

import java.time.DayOfWeek;
import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TheNumberInput(
	List<Integer> buttons,
	Boolean hasTwoFactor,
	Integer startingTimeMinutes,
	DayOfWeek startDay,
	Integer currentHour,
	Boolean timerBelowHalf
) implements ModuleInput {}
