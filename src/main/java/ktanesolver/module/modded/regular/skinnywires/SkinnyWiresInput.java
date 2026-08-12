package ktanesolver.module.modded.regular.skinnywires;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SkinnyWiresInput(List<Wire> wires) implements ModuleInput {
	public record Wire(WireColor color, LetterPort letterPort, Integer numberPort) {}
	public enum WireColor { BLACK, BLUE, GREEN, ORANGE, PINK, RED, WHITE, YELLOW }
	public enum LetterPort { A, B, C }
}
