package ktanesolver.module.modded.regular.radiator;

import ktanesolver.logic.ModuleOutput;

public record RadiatorOutput(int temperature, int water) implements ModuleOutput {}
