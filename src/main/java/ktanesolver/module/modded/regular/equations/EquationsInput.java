package ktanesolver.module.modded.regular.equations;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record EquationsInput(List<String> keyColors, List<Boolean> leds) implements ModuleInput {}
