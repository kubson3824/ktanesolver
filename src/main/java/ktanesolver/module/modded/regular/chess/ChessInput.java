package ktanesolver.module.modded.regular.chess;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ChessInput(List<String> coordinates) implements ModuleInput {
}
