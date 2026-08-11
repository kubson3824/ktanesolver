package ktanesolver.module.modded.regular.sueetwall;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SueetWallInput(Integer initialBombMinutes, List<SueetWallButton> buttons) implements ModuleInput {}
