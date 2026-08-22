package ktanesolver.module.modded.regular.harmonysequence;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record HarmonySequenceOutput(int stage, List<Integer> pressPositions) implements ModuleOutput {}
