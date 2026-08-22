package ktanesolver.module.modded.regular.stainedglass;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record StainedGlassOutput(List<String> smashPositions, String twitchCommand) implements ModuleOutput {}
