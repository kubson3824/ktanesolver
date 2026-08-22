package ktanesolver.module.modded.regular.simonstores;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SimonStoresOutput(
        int stage,
        List<Integer> stageValues,
        int result,
        String balancedTernary,
        String executionOrder,
        List<String> signedPresses,
        String twitchCommand) implements ModuleOutput {}
