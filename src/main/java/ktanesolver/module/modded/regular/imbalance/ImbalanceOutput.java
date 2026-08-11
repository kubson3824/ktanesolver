package ktanesolver.module.modded.regular.imbalance;

import ktanesolver.logic.ModuleOutput;

public record ImbalanceOutput(int topValue, int bottomValue, int answer) implements ModuleOutput {}
