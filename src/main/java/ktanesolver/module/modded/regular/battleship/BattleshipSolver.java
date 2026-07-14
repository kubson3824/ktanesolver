package ktanesolver.module.modded.regular.battleship;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.BATTLESHIP,
	id = "BattleshipModule",
	name = "Battleship",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Deduce every ship in a 5×5 grid from the fleet, edge counts, and safe radar readings.",
	tags = { "5×5 grid", "deduction", "edgework", "ships" }
)
public class BattleshipSolver extends AbstractModuleSolver<BattleshipInput, BattleshipOutput> {
	private static final int SIZE = 5;
	private static final Map<Integer, List<Placement>> PLACEMENTS = createPlacements();

	@Override
	protected SolveResult<BattleshipOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BattleshipInput input) {
		String validation = validate(input);
		if(validation != null) return failure(validation);

		List<String> safeLocations = safeLocations(bomb);
		storeState(module, "input", input);
		if(input.radarShips() == null) return success(new BattleshipOutput(safeLocations, List.of()), false);

		Set<String> radarShips = new LinkedHashSet<>();
		for(String location : input.radarShips()) {
			if(location == null || !location.strip().toUpperCase(Locale.ROOT).matches("[A-E][1-5]")) {
				return failure("Radar ship locations must be coordinates from A1 to E5");
			}
			radarShips.add(location.strip().toUpperCase(Locale.ROOT));
		}
		if(!safeLocations.containsAll(radarShips)) return failure("Only safe radar locations may be marked as ships");

		List<Integer> ships = new ArrayList<>();
		for(int length = 4; length >= 1; length--)
			for(int count = 0; count < input.shipCounts().get(length - 1); count++) ships.add(length);

		long safeMask = mask(safeLocations);
		long safeShipMask = mask(radarShips);
		List<Long> solutions = new ArrayList<>(2);
		search(ships, 0, new int[ships.size()], 0, 0, new int[SIZE], new int[SIZE],
			input.rowCounts(), input.columnCounts(), safeMask, safeShipMask, solutions);

		if(solutions.isEmpty()) return failure("No board matches these counts and radar readings");
		if(solutions.size() > 1) return failure("The board is not unique; recheck the counts and radar readings");

		List<String> shipLocations = coordinates(solutions.getFirst());
		return success(new BattleshipOutput(safeLocations, shipLocations));
	}

	private static String validate(BattleshipInput input) {
		if(input == null) return "Enter the row, column, and fleet counts";
		if(!validCounts(input.rowCounts(), 5) || !validCounts(input.columnCounts(), 5)) return "Row and column counts must each contain five values from 0 to 5";
		if(!validCounts(input.shipCounts(), 4)) return "Fleet counts must contain four values from 0 to 5";

		int rowTotal = input.rowCounts().stream().mapToInt(Integer::intValue).sum();
		int columnTotal = input.columnCounts().stream().mapToInt(Integer::intValue).sum();
		int fleetTotal = 0;
		for(int length = 1; length <= 4; length++) fleetTotal += length * input.shipCounts().get(length - 1);
		if(fleetTotal == 0) return "Enter at least one ship";
		return rowTotal == columnTotal && rowTotal == fleetTotal ? null : "Row, column, and fleet totals must match";
	}

	private static boolean validCounts(List<Integer> counts, int size) {
		return counts != null && counts.size() == size && counts.stream().allMatch(value -> value != null && value >= 0 && value <= 5);
	}

	private static List<String> safeLocations(BombEntity bomb) {
		List<Integer> columns = bomb.getSerialNumber().chars().filter(Character::isLetter).map(ch -> (Character.toUpperCase(ch) - 'A') % SIZE).boxed().toList();
		List<Integer> rows = bomb.getSerialNumber().chars().filter(Character::isDigit).map(ch -> ((ch - '0') + SIZE - 1) % SIZE).boxed().toList();
		LinkedHashSet<String> result = new LinkedHashSet<>();
		for(int i = 0; i < Math.min(columns.size(), rows.size()); i++) result.add(coordinate(columns.get(i), rows.get(i)));

		int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		result.add(coordinate((portCount + SIZE - 1) % SIZE,
			(bomb.getIndicators().size() + bomb.getBatteryCount() + SIZE - 1) % SIZE));
		return List.copyOf(result);
	}

	private static void search(
		List<Integer> ships, int shipIndex, int[] selectedPlacements, long occupied, long blocked,
		int[] rowCounts, int[] columnCounts, List<Integer> targetRows, List<Integer> targetColumns,
		long safeMask, long safeShipMask, List<Long> solutions
	) {
		if(solutions.size() == 2) return;
		if(shipIndex == ships.size()) {
			if(Arrays.equals(rowCounts, targetRows.stream().mapToInt(Integer::intValue).toArray())
				&& Arrays.equals(columnCounts, targetColumns.stream().mapToInt(Integer::intValue).toArray())
				&& (occupied & safeMask) == safeShipMask) solutions.add(occupied);
			return;
		}

		int length = ships.get(shipIndex);
		List<Placement> placements = PLACEMENTS.get(length);
		int start = shipIndex > 0 && ships.get(shipIndex - 1) == length ? selectedPlacements[shipIndex - 1] + 1 : 0;
		for(int i = start; i < placements.size(); i++) {
			Placement placement = placements.get(i);
			if((placement.cells() & blocked) != 0 || exceeds(rowCounts, placement.rowCounts(), targetRows) || exceeds(columnCounts, placement.columnCounts(), targetColumns)) continue;

			selectedPlacements[shipIndex] = i;
			add(rowCounts, placement.rowCounts(), 1);
			add(columnCounts, placement.columnCounts(), 1);
			search(ships, shipIndex + 1, selectedPlacements, occupied | placement.cells(), blocked | placement.blocked(),
				rowCounts, columnCounts, targetRows, targetColumns, safeMask, safeShipMask, solutions);
			add(rowCounts, placement.rowCounts(), -1);
			add(columnCounts, placement.columnCounts(), -1);
		}
	}

	private static boolean exceeds(int[] counts, int[] additions, List<Integer> targets) {
		for(int i = 0; i < SIZE; i++) if(counts[i] + additions[i] > targets.get(i)) return true;
		return false;
	}

	private static void add(int[] counts, int[] additions, int direction) {
		for(int i = 0; i < SIZE; i++) counts[i] += direction * additions[i];
	}

	private static Map<Integer, List<Placement>> createPlacements() {
		Map<Integer, List<Placement>> result = new HashMap<>();
		for(int length = 1; length <= 4; length++) {
			List<Placement> placements = new ArrayList<>();
			for(int row = 0; row < SIZE; row++) for(int column = 0; column <= SIZE - length; column++) placements.add(placement(column, row, length, true));
			if(length > 1) for(int column = 0; column < SIZE; column++) for(int row = 0; row <= SIZE - length; row++) placements.add(placement(column, row, length, false));
			result.put(length, List.copyOf(placements));
		}
		return Map.copyOf(result);
	}

	private static Placement placement(int column, int row, int length, boolean horizontal) {
		long cells = 0;
		long blocked = 0;
		int[] rowCounts = new int[SIZE];
		int[] columnCounts = new int[SIZE];
		for(int offset = 0; offset < length; offset++) {
			int x = horizontal ? column + offset : column;
			int y = horizontal ? row : row + offset;
			cells |= 1L << (y * SIZE + x);
			rowCounts[y]++;
			columnCounts[x]++;
			for(int dy = -1; dy <= 1; dy++) for(int dx = -1; dx <= 1; dx++)
				if(x + dx >= 0 && x + dx < SIZE && y + dy >= 0 && y + dy < SIZE) blocked |= 1L << ((y + dy) * SIZE + x + dx);
		}
		return new Placement(cells, blocked, rowCounts, columnCounts);
	}

	private static long mask(Iterable<String> coordinates) {
		long mask = 0;
		for(String coordinate : coordinates) mask |= 1L << ((coordinate.charAt(1) - '1') * SIZE + coordinate.charAt(0) - 'A');
		return mask;
	}

	private static List<String> coordinates(long mask) {
		List<String> result = new ArrayList<>();
		for(int row = 0; row < SIZE; row++) for(int column = 0; column < SIZE; column++)
			if((mask & (1L << (row * SIZE + column))) != 0) result.add(coordinate(column, row));
		return List.copyOf(result);
	}

	private static String coordinate(int column, int row) {
		return "" + (char)('A' + column) + (char)('1' + row);
	}

	private record Placement(long cells, long blocked, int[] rowCounts, int[] columnCounts) {}
}
