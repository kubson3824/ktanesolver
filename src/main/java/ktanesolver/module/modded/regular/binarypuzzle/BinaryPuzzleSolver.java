package ktanesolver.module.modded.regular.binarypuzzle;

import java.util.ArrayList;
import java.util.List;
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
@ModuleInfo(type = ModuleType.BINARY_PUZZLE, id = "BinaryPuzzleModule", name = "Binary Puzzle",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Complete the 6×6 binary grid without triples or duplicate rows and columns.",
    tags = {"binary", "grid", "logic"})
public class BinaryPuzzleSolver extends AbstractModuleSolver<BinaryPuzzleInput, BinaryPuzzleOutput> {
    @Override protected SolveResult<BinaryPuzzleOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BinaryPuzzleInput input) {
        if (input == null || input.rows() == null || input.rows().size() != 6)
            return failure("Enter exactly six rows");
        int[] grid = new int[36];
        for (int r = 0; r < 6; r++) {
            String row = input.rows().get(r) == null ? "" : input.rows().get(r).replaceAll("\\s", "");
            if (!row.matches("[01?.]{6}")) return failure("Each row must contain six 0, 1, or ? cells");
            for (int c = 0; c < 6; c++) grid[r * 6 + c] = row.charAt(c) == '0' ? 0 : row.charAt(c) == '1' ? 1 : -1;
        }
        if (!valid(grid) || !solve(grid, 0)) return failure("That grid has no valid Binary Puzzle solution");
        List<String> rows = new ArrayList<>();
        StringBuilder flat = new StringBuilder(36);
        for (int r = 0; r < 6; r++) {
            StringBuilder value = new StringBuilder(6);
            for (int c = 0; c < 6; c++) value.append(grid[r * 6 + c]);
            rows.add(value.toString()); flat.append(value);
        }
        return success(new BinaryPuzzleOutput(List.copyOf(rows), flat.toString()));
    }

    private static boolean solve(int[] grid, int from) {
        int ix = from; while (ix < 36 && grid[ix] != -1) ix++;
        if (ix == 36) return valid(grid);
        for (int value = 0; value <= 1; value++) { grid[ix] = value; if (valid(grid) && solve(grid, ix + 1)) return true; }
        grid[ix] = -1; return false;
    }
    private static boolean valid(int[] g) {
        for (int i = 0; i < 6; i++) {
            if (!validLine(g, i * 6, 1) || !validLine(g, i, 6)) return false;
        }
        for (int a = 0; a < 6; a++) for (int b = a + 1; b < 6; b++) {
            if (sameComplete(g, a * 6, b * 6, 1) || sameComplete(g, a, b, 6)) return false;
        }
        return true;
    }
    private static boolean validLine(int[] g, int start, int step) {
        int zeros = 0, ones = 0;
        for (int i = 0; i < 6; i++) { int v = g[start + i * step]; if (v == 0) zeros++; if (v == 1) ones++; }
        if (zeros > 3 || ones > 3) return false;
        for (int i = 0; i < 4; i++) { int v = g[start + i * step]; if (v != -1 && v == g[start + (i + 1) * step] && v == g[start + (i + 2) * step]) return false; }
        return true;
    }
    private static boolean sameComplete(int[] g, int a, int b, int step) {
        for (int i = 0; i < 6; i++) if (g[a + i * step] == -1 || g[a + i * step] != g[b + i * step]) return false;
        return true;
    }
}
