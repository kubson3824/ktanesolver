package ktanesolver.module.modded.regular.gameoflife;

import java.util.List;

final class GameOfLifeRules {
	static final int CELL_COUNT = 48;
	static final int COLUMNS = 6;

	private GameOfLifeRules() {}

	static String validate(List<GameOfLifeInput.Cell> cells) {
		if (cells == null || cells.size() != CELL_COUNT) return "Enter all 48 cells";
		if (cells.stream().anyMatch(cell -> cell == null || cell.first() == null || cell.second() == null)) {
			return "Every cell must have two observed colors";
		}
		return null;
	}

	static List<Boolean> nextGeneration(List<Boolean> cells) {
		return java.util.stream.IntStream.range(0, CELL_COUNT).mapToObj(index -> {
			int row = index / COLUMNS;
			int column = index % COLUMNS;
			int neighbors = 0;
			for (int rowOffset = -1; rowOffset <= 1; rowOffset++) {
				for (int columnOffset = -1; columnOffset <= 1; columnOffset++) {
					if (rowOffset == 0 && columnOffset == 0) continue;
					int neighborRow = row + rowOffset;
					int neighborColumn = column + columnOffset;
					if (neighborRow >= 0 && neighborRow < 8 && neighborColumn >= 0 && neighborColumn < COLUMNS
						&& cells.get(neighborRow * COLUMNS + neighborColumn)) neighbors++;
				}
			}
			return cells.get(index) ? neighbors == 2 || neighbors == 3 : neighbors == 3;
		}).toList();
	}
}
