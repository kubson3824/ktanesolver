package ktanesolver.module.modded.regular.marbletumble;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MarbleTumbleInput(
	List<CylinderColor> colors,
	List<Integer> safeGaps,
	List<Integer> trapPositions
) implements ModuleInput {
	public enum CylinderColor { RED, YELLOW, GREEN, BLUE, SILVER }
}
