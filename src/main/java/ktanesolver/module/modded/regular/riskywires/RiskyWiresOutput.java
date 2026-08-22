package ktanesolver.module.modded.regular.riskywires;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record RiskyWiresOutput(List<Integer> cutPositions, boolean reversedSixWireRules, boolean shiftedEightWireRules) implements ModuleOutput {}
