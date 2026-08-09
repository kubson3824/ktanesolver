package ktanesolver.module.modded.regular.mazescrambler;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MazeScramblerOutput(int maze, List<String> presses, List<String> moves) implements ModuleOutput {}
