package ktanesolver.module.modded.regular.sphere;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SphereInput(List<Color> colors, List<Boolean> correctResponses) implements ModuleInput {
	public enum Color { RED, BLUE, GREEN, ORANGE, PINK, PURPLE, GREY, WHITE }
}
