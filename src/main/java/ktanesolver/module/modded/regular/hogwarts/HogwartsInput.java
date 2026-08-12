package ktanesolver.module.modded.regular.hogwarts;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HogwartsInput(List<HogwartsEntry> entries) implements ModuleInput {}
