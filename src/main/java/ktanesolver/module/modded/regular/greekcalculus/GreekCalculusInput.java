package ktanesolver.module.modded.regular.greekcalculus;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record GreekCalculusInput(
	List<DataPoint> dataPoints,
	String blueParameter,
	String yellowParameter,
	LedColor ledColor
) implements ModuleInput {
	public record DataPoint(int x, String y) {}

	public enum LedColor { GREEN, RED, BLUE, YELLOW, OTHER }
}
