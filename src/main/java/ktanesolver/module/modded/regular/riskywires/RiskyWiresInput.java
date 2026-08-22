package ktanesolver.module.modded.regular.riskywires;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record RiskyWiresInput(String idNumber, LedColor topLed, LedColor bottomLed, List<WireColor> wireColors, int failedGambleAttempt) implements ModuleInput {
	public enum LedColor { OFF, RED, GREEN }
	public enum WireColor { RED, BLUE, YELLOW, GREEN, PURPLE }
}
