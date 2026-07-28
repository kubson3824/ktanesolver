package ktanesolver.module.modded.regular.cooking;

import ktanesolver.logic.ModuleOutput;

public record CookingOutput(
	String meal,
	int temperatureC,
	String ovenSetting,
	boolean lightOn,
	String person,
	int timeMinutes
) implements ModuleOutput {}
