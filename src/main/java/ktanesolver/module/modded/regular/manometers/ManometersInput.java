package ktanesolver.module.modded.regular.manometers;

import ktanesolver.logic.ModuleInput;

public record ManometersInput(
	int stage,
	String screenColor,
	String minusColor,
	String plusColor,
	Boolean blueScreenSeenPreviously,
	Boolean orangeScreenSeenPreviously,
	String topColor,
	String bottomLeftColor,
	String bottomRightColor,
	Boolean underFiveMinutes,
	Integer month,
	Integer day,
	Integer dayOfWeek,
	Integer hour
) implements ModuleInput {}
