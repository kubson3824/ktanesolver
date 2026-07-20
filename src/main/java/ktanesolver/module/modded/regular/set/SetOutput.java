package ktanesolver.module.modded.regular.set;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SetOutput(List<String> positions) implements ModuleOutput {}
