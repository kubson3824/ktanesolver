package ktanesolver.module.modded.regular.splittingtheloot;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SplittingTheLootInput(List<String> bags, int coloredBag, String coloredBagColor) implements ModuleInput {}
