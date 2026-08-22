package ktanesolver.module.modded.regular.coloredkeys;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ColoredKeysOutput(int keyPosition, String position, List<Integer> scores) implements ModuleOutput {}
