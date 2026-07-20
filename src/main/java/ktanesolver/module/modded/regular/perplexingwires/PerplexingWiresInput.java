package ktanesolver.module.modded.regular.perplexingwires;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record PerplexingWiresInput(List<Wire> wires, List<Boolean> filledStars, List<Boolean> ledsOn) implements ModuleInput {
	public record Wire(int topConnector, WireColor color, ArrowColor arrowColor, ArrowDirection arrowDirection) {}
	public enum WireColor { RED, YELLOW, BLUE, WHITE, GREEN, ORANGE, PURPLE, BLACK }
	public enum ArrowColor { RED, GREEN, BLUE, YELLOW, PURPLE }
	public enum ArrowDirection { UP, LEFT, DOWN, RIGHT }
}
