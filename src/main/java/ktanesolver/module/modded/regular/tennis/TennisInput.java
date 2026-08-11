package ktanesolver.module.modded.regular.tennis;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TennisInput(String tournament, boolean mensPlay, List<SetScore> sets, String mode, int player1Score, int player2Score) implements ModuleInput {
	public record SetScore(int player1, int player2) {}
}
