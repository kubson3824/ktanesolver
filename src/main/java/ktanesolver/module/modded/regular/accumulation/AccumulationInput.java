package ktanesolver.module.modded.regular.accumulation;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record AccumulationInput(Color borderColor, List<StageObservation> stages) implements ModuleInput {
	public enum Color { BLUE, BROWN, GREEN, GREY, LIME, ORANGE, PINK, RED, WHITE, YELLOW }
	public record StageObservation(Color backgroundColor, List<Color> digitColors) {}
}
