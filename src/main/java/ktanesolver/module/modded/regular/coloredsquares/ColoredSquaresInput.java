package ktanesolver.module.modded.regular.coloredsquares;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.modded.regular.coloredsquares.ColoredSquaresOutput.Group;

public record ColoredSquaresInput(int whiteCount, Group previousGroup) implements ModuleInput {
}
