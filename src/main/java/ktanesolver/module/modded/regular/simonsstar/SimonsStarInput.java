package ktanesolver.module.modded.regular.simonsstar;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SimonsStarInput(List<Color> buttonColors, Color flash, Integer digit) implements ModuleInput {
	public enum Color { BLUE, GREEN, PURPLE, RED, YELLOW }
}
