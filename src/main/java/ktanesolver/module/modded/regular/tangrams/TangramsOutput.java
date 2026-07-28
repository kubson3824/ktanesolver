package ktanesolver.module.modded.regular.tangrams;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TangramsOutput(List<TangramsConnection> connections) implements ModuleOutput {}
