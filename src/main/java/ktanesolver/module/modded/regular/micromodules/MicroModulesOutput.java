package ktanesolver.module.modded.regular.micromodules;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record MicroModulesOutput(
    List<String> solveOrder,
    boolean anyOrder,
    List<Integer> cutWires,
    int keypadPosition,
    String morseCode,
    String mathCode,
    List<String> twitchCommands
) implements ModuleOutput {}
