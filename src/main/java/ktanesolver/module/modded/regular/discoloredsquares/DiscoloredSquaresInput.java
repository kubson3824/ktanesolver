package ktanesolver.module.modded.regular.discoloredsquares;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record DiscoloredSquaresInput(Integer stage, List<String> colors) implements ModuleInput {}
