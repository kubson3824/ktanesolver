package ktanesolver.module.modded.regular.neutralization;

import ktanesolver.logic.ModuleInput;

public record NeutralizationInput(String acidColor, int acidVolume) implements ModuleInput {}
