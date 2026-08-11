package ktanesolver.module.modded.regular.kudosudoku;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record KudosudokuInput(List<Integer> grid, String coordinate, String coding) implements ModuleInput {}
