package ktanesolver.module.modded.regular.bamboozlingbutton;

import ktanesolver.logic.ModuleInput;

public record BamboozlingButtonInput(
	Color buttonColor,
	String firstDisplay,
	boolean commaAfterFirst,
	String thirdDisplay,
	String fourthDisplay,
	Color fourthDisplayColor,
	String fifthDisplay,
	Color fifthDisplayColor,
	String topLabel,
	String bottomLabel,
	QuoteStyle quoteStyle
) implements ModuleInput {
	public enum Color { WHITE, RED, ORANGE, YELLOW, LIME, GREEN, JADE, GREY, CYAN, AZURE, BLUE, VIOLET, MAGENTA, ROSE, BLACK }
	public enum QuoteStyle { NONE, SINGLE, DOUBLE }
}
