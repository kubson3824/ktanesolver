package ktanesolver.module.modded.regular.flashinglights;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record FlashingLightsInput(List<FlashingLightsColor> top, List<FlashingLightsColor> bottom) implements ModuleInput {}
