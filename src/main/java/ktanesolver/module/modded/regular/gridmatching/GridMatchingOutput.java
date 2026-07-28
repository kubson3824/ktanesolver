package ktanesolver.module.modded.regular.gridmatching;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GridMatchingOutput(String letter, List<String> actions) implements ModuleOutput {}
