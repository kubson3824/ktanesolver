package ktanesolver.module.modded.regular.theblock;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TheBlockOutput(int rule, List<String> presses) implements ModuleOutput {}
