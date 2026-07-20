package ktanesolver.module.modded.regular.set;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SetInput(List<Card> cards) implements ModuleInput {
	public record Card(String symbol, Integer dots, String shading) {}
}
