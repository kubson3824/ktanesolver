package ktanesolver.module.modded.regular.morseamaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.vanilla.regular.maze.Move;

public record MorseAMazeOutput(int mazeIndex, String mazeWord, List<Move> moves) implements ModuleOutput {
}
