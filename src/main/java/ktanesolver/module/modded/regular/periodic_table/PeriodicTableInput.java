package ktanesolver.module.modded.regular.periodic_table;

import ktanesolver.logic.ModuleInput;

public record PeriodicTableInput(
	String elementName,
	Color elementColor,
	String symbol,
	Color symbolColor,
	Integer displayedNumber,
	Color numberColor,
	Integer coloredButtonNumber,
	Color buttonColor
) implements ModuleInput {
	public enum Color { RED, ORANGE, YELLOW, GREEN, BLUE, WHITE, GREY, GRAY }
}
