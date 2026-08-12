package ktanesolver.module.modded.regular.hogwarts;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record HogwartsOutput(List<HogwartsSelection> selections, List<String> winningHouses) implements ModuleOutput {}
