package ktanesolver.module.modded.regular.sonicthehedgehog;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SonicTheHedgehogInput(int stage, List<String> sounds, String picture) implements ModuleInput {}
