package ktanesolver.module.modded.regular.blindalley;

import java.util.List;
import java.util.Map;

import ktanesolver.logic.ModuleOutput;

public record BlindAlleyOutput(List<String> regions, Map<String, Integer> conditionCounts) implements ModuleOutput {}
