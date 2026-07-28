package ktanesolver.module.modded.regular.thenumber;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TheNumberOutput(String code, List<Integer> buttonPositions) implements ModuleOutput {}
