package ktanesolver.module.modded.regular.calendar;

import ktanesolver.logic.ModuleInput;

public record CalendarInput(
	Integer activationMonth,
	Integer activationDay,
	String ledColor,
	String holiday,
	Boolean leapYear
) implements ModuleInput {}
