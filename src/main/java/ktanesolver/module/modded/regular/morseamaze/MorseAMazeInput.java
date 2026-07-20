package ktanesolver.module.modded.regular.morseamaze;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.shared.grid.Cell;

public record MorseAMazeInput(String word, Cell start, Cell target, Integer mazeValueOverride) implements ModuleInput {
}
