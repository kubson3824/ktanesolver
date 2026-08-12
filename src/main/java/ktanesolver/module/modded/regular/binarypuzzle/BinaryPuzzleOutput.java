package ktanesolver.module.modded.regular.binarypuzzle;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record BinaryPuzzleOutput(List<String> rows, String solution) implements ModuleOutput {}
