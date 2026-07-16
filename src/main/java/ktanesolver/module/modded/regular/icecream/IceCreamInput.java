package ktanesolver.module.modded.regular.icecream;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record IceCreamInput(String customer, List<String> flavors, boolean resetStage) implements ModuleInput {}
