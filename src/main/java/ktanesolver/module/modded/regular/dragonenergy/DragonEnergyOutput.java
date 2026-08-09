package ktanesolver.module.modded.regular.dragonenergy;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record DragonEnergyOutput(List<String> acceptableWords, List<Integer> safeTimerDigits, int swapScenario) implements ModuleOutput {}
