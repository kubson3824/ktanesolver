package ktanesolver.module.modded.regular.blackhole;

import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

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
	type = ModuleType.BLACK_HOLE,
	id = "BlackHoleModule",
	name = "Black Hole",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Follow the shared grid code and account for shortcuts caused by solving other modules.",
	tags = {"grid", "sequence", "timing", "boss"}
)
public class BlackHoleSolver extends AbstractModuleSolver<BlackHoleInput, BlackHoleOutput> {
	private static final int[][] GRID = {
		{3, 4, 1, 0, 2, 3, 1, 2, 0, 4},
		{1, 3, 0, 2, 4, 1, 2, 3, 4, 0},
		{3, 2, 4, 2, 1, 3, 0, 0, 1, 4},
		{4, 0, 0, 1, 3, 4, 2, 2, 1, 3},
		{1, 2, 1, 3, 0, 0, 4, 3, 4, 2},
		{4, 0, 2, 3, 4, 1, 3, 0, 2, 1},
		{2, 1, 3, 1, 3, 0, 4, 4, 0, 2},
		{2, 4, 4, 0, 0, 2, 1, 1, 3, 3},
		{0, 1, 3, 4, 2, 2, 0, 4, 3, 1},
		{0, 3, 2, 4, 1, 4, 3, 1, 2, 0}
	};
	private static final int[] DX = {0, 1, 1, 1, 0, -1, -1, -1};
	private static final int[] DY = {-1, -1, 0, 1, 1, 1, 0, -1};

	@Override
	protected SolveResult<BlackHoleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BlackHoleInput input
	) {
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.length() < 6
			|| !Character.isDigit(serial.charAt(2)) || !Character.isDigit(serial.charAt(5))) {
			return failure("Serial characters 3 and 6 must be digits");
		}

		List<ModuleEntity> blackHoles = bomb.getModules().stream()
			.filter(candidate -> candidate.getType() == ModuleType.BLACK_HOLE)
			.toList();
		if (blackHoles.stream().noneMatch(candidate -> candidate == module)) {
			return failure("This Black Hole is not attached to the bomb");
		}

		Map<ModuleEntity, Progress> progress = new IdentityHashMap<>();
		for (ModuleEntity candidate : blackHoles) {
			progress.put(candidate, candidate.getStateAs(Progress.class, Progress::initial));
		}
		Progress current = progress.get(module);
		if (current.entered() >= current.expected()) return failure("This Black Hole is already complete");

		int solvedOther = (int) bomb.getModules().stream()
			.filter(candidate -> candidate.getType() != ModuleType.BLACK_HOLE && candidate.isSolved())
			.count();
		boolean shortened = false;
		for (var entry : progress.entrySet()) {
			Progress value = entry.getValue();
			if (!shortened && value.lastEntry() && value.entered() < value.expected()
				&& solvedOther > value.solvedOtherAtEntry()) {
				value = new Progress(value.entered(), Math.max(value.entered() + 1, value.expected() - 2), false, solvedOther);
				shortened = true;
			}
			progress.put(entry.getKey(), value.withLastEntry(false));
		}

		int enteredGlobally = progress.values().stream().mapToInt(Progress::entered).sum();
		int codeLength = blackHoles.size() * 7;
		if (enteredGlobally >= codeLength) return failure("The shared Black Hole code is already complete");
		int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		int digit = calculateCode(serial, portCount, codeLength).get(enteredGlobally);

		current = progress.get(module);
		int enteredHere = current.entered() + 1;
		current = new Progress(enteredHere, current.expected(), enteredHere < current.expected(), solvedOther);
		progress.put(module, current);
		progress.forEach(ModuleEntity::setState);

		enteredGlobally++;
		int expectedGlobally = progress.values().stream().mapToInt(Progress::expected).sum();
		BlackHoleOutput output = new BlackHoleOutput(
			digit, enteredGlobally, expectedGlobally, enteredHere, current.expected(), shortened
		);
		return success(output, enteredHere == current.expected());
	}

	static List<Integer> calculateCode(String serial, int portCount, int length) {
		int x = serial.charAt(2) - '0';
		int y = serial.charAt(5) - '0';
		int direction = Math.floorMod(portCount, 8);
		java.util.ArrayList<Integer> code = new java.util.ArrayList<>(length);
		for (int index = 0; index < length; index++) {
			int digit = 0;
			for (int step = 0; step <= index; step++) {
				digit = (digit + GRID[y][x]) % 5;
				x = Math.floorMod(x + DX[direction], 10);
				y = Math.floorMod(y + DY[direction], 10);
			}
			code.add(digit);
			direction = (direction + 1) % 8;
		}
		return List.copyOf(code);
	}

	private record Progress(int entered, int expected, boolean lastEntry, int solvedOtherAtEntry) {
		private static Progress initial() { return new Progress(0, 7, false, 0); }
		private Progress withLastEntry(boolean value) {
			return new Progress(entered, expected, value, solvedOtherAtEntry);
		}
	}
}
