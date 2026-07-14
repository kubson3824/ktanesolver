package ktanesolver.module.modded.regular.theclock;

import ktanesolver.logic.ModuleInput;

public record TheClockInput(
	Integer hour,
	Integer minute,
	Period period,
	NumeralStyle numeralStyle,
	CasingColor casingColor,
	Boolean colorsMatch,
	HandStyle handStyle,
	NumeralColor numeralColor,
	TextColor amPmTextColor,
	Boolean secondsHandPresent
) implements ModuleInput {
	public enum Period { AM, PM }
	public enum NumeralStyle { NONE, ARABIC, ROMAN }
	public enum CasingColor { SILVER, GOLD }
	public enum HandStyle { SPADES, ARROWS, LINES }
	public enum NumeralColor { RED, GREEN, BLUE, GOLD, BLACK }
	public enum TextColor { BLACK, WHITE }
}
