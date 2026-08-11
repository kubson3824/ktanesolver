package ktanesolver.module.modded.regular.crackbox;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
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
    type = ModuleType.CRACKBOX,
    id = "CrackboxModule",
    name = "Crackbox",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Complete the 4×4 parity-and-adjacency number grid.",
    tags = {"grid", "numbers", "logic", "constraint satisfaction"}
)
public class CrackboxSolver extends AbstractModuleSolver<CrackboxInput, CrackboxOutput> {
    private static final int SIZE = 4;

    @Override
    protected SolveResult<CrackboxOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, CrackboxInput input
    ) {
        if (input == null || input.cells() == null || input.selectedCell() == null) {
            return failure("Enter all sixteen cells and the currently highlighted cell");
        }
        if (input.cells().size() != SIZE * SIZE) return failure("Enter exactly sixteen cells in reading order");
        if (input.selectedCell() < 1 || input.selectedCell() > SIZE * SIZE) return failure("The highlighted cell must be from 1 through 16");

        int[] grid = new int[SIZE * SIZE];
        boolean[] originallyEmpty = new boolean[grid.length];
        boolean[] used = new boolean[11];
        int black = 0, given = 0;
        for (int i = 0; i < grid.length; i++) {
            String cell = input.cells().get(i);
            if (cell == null) return failure("Each cell must be black, empty, or a number from 1 through 10");
            String value = cell.trim().toUpperCase(Locale.ROOT);
            if (value.equals("BLACK")) { grid[i] = -1; black++; continue; }
            if (value.isEmpty() || value.equals("EMPTY")) { originallyEmpty[i] = true; continue; }
            try { grid[i] = Integer.parseInt(value); }
            catch (NumberFormatException ignored) { return failure("Each cell must be black, empty, or a number from 1 through 10"); }
            if (grid[i] < 1 || grid[i] > 10) return failure("Given numbers must be from 1 through 10");
            if (used[grid[i]]) return failure("The two given numbers must be different");
            used[grid[i]] = true; given++;
        }
        if (black != 6 || given != 2) return failure("Crackbox must have six black cells and two given numbers");
        if (grid[input.selectedCell() - 1] == -1) return failure("The highlighted cell cannot be black");
        if (!assignedCellsAreCompatible(grid)) return failure("The given numbers violate an adjacency rule");
        if (!search(grid, used)) return failure("That Crackbox has no valid completion");

        List<String> solution = Arrays.stream(grid).mapToObj(value -> value < 0 ? "BLACK" : String.valueOf(value)).toList();
        List<String> twitchTokens = new ArrayList<>();
        int current = input.selectedCell() - 1;
        for (int target = 0; target < grid.length; target++) if (originallyEmpty[target]) {
            for (int move = 0; move < (target / SIZE - current / SIZE + SIZE) % SIZE; move++) twitchTokens.add("d");
            current = target / SIZE * SIZE + current % SIZE;
            for (int move = 0; move < (target % SIZE - current % SIZE + SIZE) % SIZE; move++) twitchTokens.add("r");
            twitchTokens.add(String.valueOf(grid[target]));
            current = target;
        }
        return success(new CrackboxOutput(solution, List.copyOf(twitchTokens)));
    }

    private static boolean search(int[] grid, boolean[] used) {
        int position = -1, score = -1;
        for (int i = 0; i < grid.length; i++) if (grid[i] == 0) {
            int assignedNeighbours = (int) neighbours(i).stream().filter(index -> grid[index] > 0).count();
            if (assignedNeighbours > score) { position = i; score = assignedNeighbours; }
        }
        if (position < 0) return true;
        for (int value = 1; value <= 10; value++) if (!used[value] && canPlace(grid, position, value)) {
            grid[position] = value; used[value] = true;
            if (search(grid, used)) return true;
            grid[position] = 0; used[value] = false;
        }
        return false;
    }

    private static boolean assignedCellsAreCompatible(int[] grid) {
        for (int position = 0; position < grid.length; position++) if (grid[position] > 0) {
            for (int neighbour : neighbours(position)) if (neighbour > position && grid[neighbour] > 0 && !compatible(grid[position], grid[neighbour])) return false;
        }
        return true;
    }
    private static boolean canPlace(int[] grid, int position, int value) {
        return neighbours(position).stream().allMatch(index -> grid[index] <= 0 || compatible(value, grid[index]));
    }
    private static boolean compatible(int first, int second) {
        int difference = Math.abs(first - second);
        return difference == 1 || difference == 9 || first % 2 == second % 2;
    }
    private static List<Integer> neighbours(int position) {
        List<Integer> result = new ArrayList<>(8);
        int row = position / SIZE, column = position % SIZE;
        for (int rowOffset = -1; rowOffset <= 1; rowOffset++) for (int columnOffset = -1; columnOffset <= 1; columnOffset++) {
            if (rowOffset == 0 && columnOffset == 0) continue;
            int neighbourRow = row + rowOffset, neighbourColumn = column + columnOffset;
            if (neighbourRow >= 0 && neighbourRow < SIZE && neighbourColumn >= 0 && neighbourColumn < SIZE) result.add(neighbourRow * SIZE + neighbourColumn);
        }
        return result;
    }
}
