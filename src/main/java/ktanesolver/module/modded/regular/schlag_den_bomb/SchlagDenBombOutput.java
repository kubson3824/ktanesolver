package ktanesolver.module.modded.regular.schlag_den_bomb;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SchlagDenBombOutput(
	List<Integer> contestantGames,
	List<Integer> bombGames,
	List<Integer> unplayedGames,
	List<String> gameTypes,
	String contestantName,
	int contestantScore,
	int bombScore
) implements ModuleOutput {}
