package ktanesolver.module.modded.regular.crackbox;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record CrackboxInput(List<String> cells, Integer selectedCell) implements ModuleInput {}
