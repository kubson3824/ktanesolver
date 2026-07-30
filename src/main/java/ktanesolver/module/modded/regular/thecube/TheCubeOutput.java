package ktanesolver.module.modded.regular.thecube;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TheCubeOutput(String cipherOne, String finalCipher, List<StageSolution> stages) implements ModuleOutput {
	public record StageSolution(int stage, int cipherDigit, List<Integer> buttons) {}
}
