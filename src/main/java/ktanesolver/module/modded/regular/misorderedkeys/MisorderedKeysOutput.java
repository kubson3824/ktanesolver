package ktanesolver.module.modded.regular.misorderedkeys;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record MisorderedKeysOutput(
        List<Integer> firstValues,
        List<Integer> secondValues,
        List<Integer> pressOrder,
        String twitchCommand) implements ModuleOutput {}
