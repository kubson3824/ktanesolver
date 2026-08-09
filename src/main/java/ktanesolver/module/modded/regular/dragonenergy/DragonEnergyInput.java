package ktanesolver.module.modded.regular.dragonenergy;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record DragonEnergyInput(List<String> displayedWords, String indicatorColor) implements ModuleInput {}
