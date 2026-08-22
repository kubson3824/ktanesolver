package ktanesolver.module.modded.regular.burgeralarm;

import java.util.List;
import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.burgeralarm.BurgerAlarmInput.Ingredient;

public record BurgerAlarmOutput(
    List<Integer> tableNumbers, List<Integer> swapIndexes, List<Ingredient> pressSequence
) implements ModuleOutput {}
