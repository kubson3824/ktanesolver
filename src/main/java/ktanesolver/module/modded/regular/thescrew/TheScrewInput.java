package ktanesolver.module.modded.regular.thescrew;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record TheScrewInput(List<String> holeColors, List<String> buttonLabels) implements ModuleInput {}
