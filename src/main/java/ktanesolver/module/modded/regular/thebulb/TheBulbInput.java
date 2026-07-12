package ktanesolver.module.modded.regular.thebulb;

import ktanesolver.logic.ModuleInput;

public record TheBulbInput(Color color, Boolean opaque, Boolean lightOn, Boolean observation) implements ModuleInput {
	public enum Color { BLUE, GREEN, PURPLE, RED, WHITE, YELLOW }
}
