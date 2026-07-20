package ktanesolver.module.modded.regular.colormorse;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ColorMorseInput(
	List<String> characters,
	List<String> colors,
	List<String> operators,
	String parentheses
) implements ModuleInput {
}
