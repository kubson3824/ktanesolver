package ktanesolver.module.modded.regular.algebra;

import ktanesolver.logic.ModuleOutput;

public record AlgebraOutput(int stage, String equation, String answer) implements ModuleOutput {}
