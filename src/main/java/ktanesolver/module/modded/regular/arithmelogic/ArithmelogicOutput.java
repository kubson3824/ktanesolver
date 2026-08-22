package ktanesolver.module.modded.regular.arithmelogic;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ArithmelogicOutput(
    List<Integer> offsets, List<Integer> selectedValues, List<Integer> adjustedValues,
    List<Boolean> truthValues, String twitchCommand
) implements ModuleOutput {}
