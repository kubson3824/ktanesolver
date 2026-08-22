package ktanesolver.module.modded.regular.stainedglass;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record StainedGlassInput(List<Color> paneColors) implements ModuleInput {
	public enum Color { ICE, MALACHITE, AMBER, AMETHYST, ROSE, AUREOLIN }
}
