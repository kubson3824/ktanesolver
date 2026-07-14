package ktanesolver.module.modded.regular.binaryleds;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BinaryLedsInput(List<Integer> observations) implements ModuleInput {
}
