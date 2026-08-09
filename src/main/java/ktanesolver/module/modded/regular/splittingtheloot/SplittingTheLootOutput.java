package ktanesolver.module.modded.regular.splittingtheloot;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SplittingTheLootOutput(List<String> colors, List<Integer> values, int totalPerTeam, int coloredBag) implements ModuleOutput {}
