package ktanesolver.module.modded.regular.mysticsquare;

import java.util.ArrayList;
import java.util.BitSet;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.MYSTIC_SQUARE,
	id = "mystic_square",
	name = "Mystic Square",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the skull position and target constellation for the 3x3 sliding puzzle. Do not uncover the skull before the knight.",
	tags = { "puzzle", "sliding", "modded" }
)
public class MysticSquareSolver extends AbstractModuleSolver<MysticSquareInput, MysticSquareOutput> {

	/** Skull walk table: row = middle number 1-8, columns 1-8. Use row (when last digit on cross) or column (otherwise). */
	private static final int[][] SKULL_TABLE = {
		{ 1, 3, 5, 4, 6, 7, 2, 8 }, // middle 1
		{ 2, 5, 7, 3, 8, 1, 4, 6 }, // middle 2
		{ 6, 4, 8, 1, 7, 3, 5, 2 }, // middle 3
		{ 8, 1, 2, 5, 3, 4, 6, 7 }, // middle 4
		{ 3, 2, 6, 8, 4, 5, 7, 1 }, // middle 5
		{ 7, 6, 1, 2, 5, 8, 3, 4 }, // middle 6
		{ 4, 7, 3, 6, 1, 2, 8, 5 }, // middle 7
		{ 5, 8, 4, 7, 2, 6, 1, 3 }, // middle 8
	};

	/** Target constellation table [rowChoice][colChoice]. rowChoice: 0=R1, 1=R2, 2=R3, 3=else. colChoice: 0=C1, 1=C2, 2=C3, 3=else. */
	private static final List<Integer>[][] TARGET_TABLE = buildTargetTable();

	@SuppressWarnings("unchecked")
	private static List<Integer>[][] buildTargetTable() {
		List<Integer>[][] t = new List[4][4];
		// R1 > R2,R3
		t[0][0] = list(1, null, 2, null, null, null, 4, null, 3);
		t[0][1] = list(1, null, 2, null, null, null, 3, null, 4);
		t[0][2] = list(1, null, 3, null, null, null, 7, null, 5);
		t[0][3] = list(1, null, 3, null, null, null, 5, null, 7);
		// R2 > R1,R3
		t[1][0] = list(null, 1, null, 4, null, 2, null, 3, null);
		t[1][1] = list(null, 1, null, 3, null, 2, null, 4, null);
		t[1][2] = list(null, 2, null, 8, null, 4, null, 6, null);
		t[1][3] = list(null, 2, null, 6, null, 4, null, 8, null);
		// R3 > R1,R2
		t[2][0] = list(1, null, null, null, 2, null, null, null, 3);
		t[2][1] = list(null, null, 3, null, 2, null, 1, null, null);
		t[2][2] = list(3, null, null, null, 2, null, null, null, 1);
		t[2][3] = list(null, null, 1, null, 2, null, 3, null, null);
		// else
		t[3][0] = list(1, 2, 3, null, 4, null, null, null, null);
		t[3][1] = list(1, null, null, 2, 4, null, 3, null, null);
		t[3][2] = list(null, null, null, null, 4, null, 1, 2, 3);
		t[3][3] = list(null, null, 1, null, 4, 2, null, null, 3);
		return t;
	}

	private static List<Integer> list(Integer... a) {
		List<Integer> out = new ArrayList<>(9);
		for (Integer x : a) out.add(x);
		return out;
	}

	private static final int[] CROSS_POSITIONS = { 0, 2, 4, 6, 8 };

	@Override
	protected SolveResult<MysticSquareOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MysticSquareInput input) {
		List<Integer> grid = input.grid();
		if (grid == null || grid.size() != 9) {
			return failure("Grid must have exactly 9 cells");
		}
		int emptyIndex = -1;
		BitSet seen = new BitSet(9);
		for (int i = 0; i < 9; i++) {
			Integer v = grid.get(i);
			if (v == null) {
				if (emptyIndex >= 0) return failure("Grid must have exactly one empty cell");
				emptyIndex = i;
			} else {
				if (v < 1 || v > 8) return failure("Values must be 1-8 or empty");
				if (seen.get(v)) return failure("Duplicate value: " + v);
				seen.set(v);
			}
		}
		if (emptyIndex < 0) return failure("Grid must have exactly one empty cell");
		if (seen.cardinality() != 8) return failure("Grid must contain each of 1-8 exactly once");

		int skullPos = findSkullPosition(grid, emptyIndex, bomb);
		List<Integer> target = getTargetConstellation(grid);
		storeState(module, "input", input);
		return success(new MysticSquareOutput(skullPos, target));
	}

	private int findSkullPosition(List<Integer> grid, int emptyIndex, BombEntity bomb) {
		Integer centerVal = grid.get(4);
		if (centerVal == null) {
			// Middle empty -> skull under 7
			return indexOf(grid, 7);
		}
		int middleNumber = centerVal;
		int lastDigit = bomb.getLastDigit();
		// Position of the cell that shows the last serial digit (as displayed digit 0-9)
		int digitCell = -1;
		for (int i = 0; i < 9; i++) {
			Integer v = grid.get(i);
			if (v != null && v == lastDigit) {
				digitCell = i;
				break;
			}
		}
		// If last digit is 0 or 9, it might not appear; manual says "last digit" so 0-9. Module shows 1-8, so digit might be 0 or 9 - treat as not on cross if not found
		boolean lastDigitOnCross = false;
		if (digitCell >= 0) {
			for (int c : CROSS_POSITIONS) {
				if (digitCell == c) {
					lastDigitOnCross = true;
					break;
				}
			}
		}
		int[] sequence;
		if (lastDigitOnCross) {
			// use rows: take row (middleNumber - 1)
			sequence = SKULL_TABLE[middleNumber - 1];
		} else {
			// use columns: take column (middleNumber - 1)
			sequence = new int[8];
			for (int r = 0; r < 8; r++) {
				sequence[r] = SKULL_TABLE[r][middleNumber - 1];
			}
		}
		int current = emptyIndex;
		for (int num : sequence) {
			int nextIndex = indexOf(grid, num);
			if (isNeighbour(current, nextIndex)) {
				current = nextIndex;
			}
		}
		return current;
	}

	private int indexOf(List<Integer> grid, int value) {
		for (int i = 0; i < 9; i++) {
			if (value == grid.get(i)) return i;
		}
		throw new IllegalArgumentException("Value not in grid: " + value);
	}

	private boolean isNeighbour(int a, int b) {
		if (a == b) return false;
		int ar = a / 3, ac = a % 3;
		int br = b / 3, bc = b % 3;
		return Math.abs(ar - br) + Math.abs(ac - bc) == 1;
	}

	private List<Integer> getTargetConstellation(List<Integer> grid) {
		int r1 = grid.get(0) != null ? grid.get(0) : 0;
		r1 += grid.get(1) != null ? grid.get(1) : 0;
		r1 += grid.get(2) != null ? grid.get(2) : 0;
		int r2 = grid.get(3) != null ? grid.get(3) : 0;
		r2 += grid.get(4) != null ? grid.get(4) : 0;
		r2 += grid.get(5) != null ? grid.get(5) : 0;
		int r3 = grid.get(6) != null ? grid.get(6) : 0;
		r3 += grid.get(7) != null ? grid.get(7) : 0;
		r3 += grid.get(8) != null ? grid.get(8) : 0;
		int c1 = (grid.get(0) != null ? grid.get(0) : 0) + (grid.get(3) != null ? grid.get(3) : 0) + (grid.get(6) != null ? grid.get(6) : 0);
		int c2 = (grid.get(1) != null ? grid.get(1) : 0) + (grid.get(4) != null ? grid.get(4) : 0) + (grid.get(7) != null ? grid.get(7) : 0);
		int c3 = (grid.get(2) != null ? grid.get(2) : 0) + (grid.get(5) != null ? grid.get(5) : 0) + (grid.get(8) != null ? grid.get(8) : 0);

		int rowChoice;
		if (r1 > r2 && r1 > r3) rowChoice = 0;
		else if (r2 > r1 && r2 > r3) rowChoice = 1;
		else if (r3 > r1 && r3 > r2) rowChoice = 2;
		else rowChoice = 3;
		int colChoice;
		if (c1 > c2 && c1 > c3) colChoice = 0;
		else if (c2 > c1 && c2 > c3) colChoice = 1;
		else if (c3 > c1 && c3 > c2) colChoice = 2;
		else colChoice = 3;

		return new ArrayList<>(TARGET_TABLE[rowChoice][colChoice]);
	}
}
