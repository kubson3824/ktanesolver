package ktanesolver.module.modded.regular.simonscreams;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SimonScreamsOutput(int stage, List<SimonScreamsColor> press, String rule) implements ModuleOutput {}
