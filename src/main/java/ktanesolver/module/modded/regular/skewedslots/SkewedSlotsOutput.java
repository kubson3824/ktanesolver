package ktanesolver.module.modded.regular.skewedslots;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SkewedSlotsOutput(List<Integer> digits, String code) implements ModuleOutput {
}
