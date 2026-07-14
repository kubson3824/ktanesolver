package ktanesolver.module.modded.regular.wireplacement;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record WirePlacementInput(List<Wire> wires) implements ModuleInput {
	public record Wire(String from, String to, WireColor color) {}
	public enum WireColor { BLACK, BLUE, RED, WHITE, YELLOW }
}
