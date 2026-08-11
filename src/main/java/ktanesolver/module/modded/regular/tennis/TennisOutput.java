package ktanesolver.module.modded.regular.tennis;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TennisOutput(String binary, Integer winner, List<TennisInput.SetScore> sets, String mode, int player1Score, int player2Score, List<String> actions) implements ModuleOutput {}
