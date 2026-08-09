package ktanesolver.module.modded.regular.flashinglights;

import java.util.List;
import java.util.Map;
import ktanesolver.logic.ModuleOutput;

public record FlashingLightsOutput(List<Integer> presses, Map<FlashingLightsColor, Integer> topCounts,
	Map<FlashingLightsColor, Integer> bottomCounts) implements ModuleOutput {}
