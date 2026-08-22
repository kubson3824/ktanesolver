package ktanesolver.module.modded.regular.sevenwires;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SevenWiresInput(int displayedNumber, List<String> wireColors, List<Integer> alreadyCutPositions,
                              boolean allModulesByTimwi, boolean laundryUnicorn,
                              boolean twoFactorContainsFive, boolean noModdedModules) implements ModuleInput {}
