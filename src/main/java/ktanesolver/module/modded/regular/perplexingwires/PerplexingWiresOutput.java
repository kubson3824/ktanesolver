package ktanesolver.module.modded.regular.perplexingwires;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record PerplexingWiresOutput(List<Integer> cutFirst, List<Integer> cutNormal, List<Integer> cutLast) implements ModuleOutput {}
