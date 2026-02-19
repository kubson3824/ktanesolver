package ktanesolver.module.modded.regular.chess;

import java.util.Map;

import ktanesolver.logic.ModuleOutput;

public record ChessOutput(String coordinate, Map<String, String> pieceAssignments) implements ModuleOutput {
}
