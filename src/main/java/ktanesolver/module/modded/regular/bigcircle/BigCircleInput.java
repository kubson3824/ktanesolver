package ktanesolver.module.modded.regular.bigcircle;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BigCircleInput(String spinDirection, List<Integer> twoFactorCodes, int specialPortCount) implements ModuleInput {}
