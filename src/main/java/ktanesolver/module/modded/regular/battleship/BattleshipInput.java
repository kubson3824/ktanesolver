package ktanesolver.module.modded.regular.battleship;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record BattleshipInput(
	List<Integer> rowCounts,
	List<Integer> columnCounts,
	List<Integer> shipCounts,
	List<String> radarShips
) implements ModuleInput {}
