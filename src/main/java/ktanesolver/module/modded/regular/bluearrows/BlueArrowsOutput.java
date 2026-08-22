package ktanesolver.module.modded.regular.bluearrows;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record BlueArrowsOutput(List<String> directions, String command) implements ModuleOutput {}
