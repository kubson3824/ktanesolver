package ktanesolver.module.modded.regular.uncoloredsquares;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record UncoloredSquaresInput(List<UncoloredSquaresColor> grid) implements ModuleInput {}
