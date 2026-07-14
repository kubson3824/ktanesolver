package ktanesolver.module.modded.regular.fizzbuzz;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record FizzBuzzInput(List<Display> displays) implements ModuleInput {
	public record Display(String number, Color color) {}
	public enum Color { RED, GREEN, BLUE, YELLOW, WHITE }
}
