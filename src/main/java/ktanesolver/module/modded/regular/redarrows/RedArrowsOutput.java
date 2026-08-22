package ktanesolver.module.modded.regular.redarrows;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record RedArrowsOutput(int destinationNumber, List<String> directions, String command) implements ModuleOutput {}
