package ktanesolver.module.modded.regular.timezone;

import ktanesolver.logic.ModuleInput;

public record TimezoneInput(
	String departureCity,
	String destinationCity,
	Integer hour,
	Integer minute,
	String period,
	Boolean twelveHour
) implements ModuleInput {
}
