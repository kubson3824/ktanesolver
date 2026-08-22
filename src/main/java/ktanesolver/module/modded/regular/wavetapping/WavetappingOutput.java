package ktanesolver.module.modded.regular.wavetapping;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record WavetappingOutput(int stage, String color, int patternNumber, List<String> rows, String pressCommand) implements ModuleOutput {}
