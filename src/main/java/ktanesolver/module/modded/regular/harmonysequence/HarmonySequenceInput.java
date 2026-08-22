package ktanesolver.module.modded.regular.harmonysequence;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HarmonySequenceInput(Integer stage, List<Integer> pitchRanks) implements ModuleInput {}
