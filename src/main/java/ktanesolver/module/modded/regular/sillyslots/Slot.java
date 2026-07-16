package ktanesolver.module.modded.regular.sillyslots;

public record Slot(Color color, Shape shape) {
	public enum Color { RED, GREEN, BLUE }
	public enum Shape { BOMB, GRAPE, CHERRY, COIN }
}
