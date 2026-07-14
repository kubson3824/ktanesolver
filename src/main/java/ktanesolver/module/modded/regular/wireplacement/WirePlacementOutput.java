package ktanesolver.module.modded.regular.wireplacement;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.wireplacement.WirePlacementInput.WireColor;

public record WirePlacementOutput(WireColor referenceColor, List<CutWire> cutWires) implements ModuleOutput {
	public record CutWire(int number, String coordinate, WireColor color) {}
}
