package ktanesolver.module.modded.regular.forgeteverything;

import java.util.List;

import ktanesolver.module.modded.regular.forgeteverything.ForgetEverythingInput.Color;

public record ForgetEverythingState(List<Stage> stages, List<Integer> firstStageDigits) {
	public record Stage(int number, String dials, String nixies, List<Color> colors) {
	}
}
