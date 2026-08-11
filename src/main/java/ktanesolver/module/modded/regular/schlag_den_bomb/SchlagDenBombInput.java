package ktanesolver.module.modded.regular.schlag_den_bomb;

import ktanesolver.logic.ModuleInput;

public record SchlagDenBombInput(String contestantName, Integer contestantScore, Integer bombScore) implements ModuleInput {}
