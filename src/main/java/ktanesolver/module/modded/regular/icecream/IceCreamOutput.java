package ktanesolver.module.modded.regular.icecream;

import ktanesolver.logic.ModuleOutput;

public record IceCreamOutput(int stage, String flavor, int flavorIndex) implements ModuleOutput {}
