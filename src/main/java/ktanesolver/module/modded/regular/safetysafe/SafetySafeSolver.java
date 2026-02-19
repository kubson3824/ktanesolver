
package ktanesolver.module.modded.regular.safetysafe;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.SAFETY_SAFE,
	id = "safety_safe",
	name = "Safety Safe",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "All 6 dials must be oriented correctly. Each dial has a loud click (starting position); rotate each dial by the computed number of turns (0-11) from that position.",
	tags = { "safety_safe", "modded" }
)
public class SafetySafeSolver extends AbstractModuleSolver<SafetySafeInput, SafetySafeOutput> {

	/** Table: row = serial character (A=0..Z=25, 0=26..9=35), col = First(0), Second(1), Third(2), Fourth(3), Fifth(4), All(5). */
	private static final int[][] TABLE = {
		/* A */ { 8, 3, 4, 8, 9, 0 },
		/* B */ { 10, 1, 3, 7, 3, 8 },
		/* C */ { 2, 1, 1, 5, 3, 6 },
		/* D */ { 11, 6, 11, 11, 7, 7 },
		/* E */ { 0, 5, 5, 8, 2, 1 },
		/* F */ { 4, 2, 7, 7, 1, 5 },
		/* G */ { 7, 4, 4, 2, 10, 5 },
		/* H */ { 8, 3, 6, 6, 6, 5 },
		/* I */ { 0, 11, 0, 0, 9, 10 },
		/* J */ { 2, 11, 8, 0, 5, 6 },
		/* K */ { 5, 2, 5, 1, 0, 4 },
		/* L */ { 1, 9, 8, 11, 11, 11 },
		/* M */ { 1, 7, 9, 5, 6, 2 },
		/* N */ { 9, 5, 1, 4, 4, 9 },
		/* O */ { 5, 9, 8, 10, 2, 8 },
		/* P */ { 3, 10, 9, 1, 9, 7 },
		/* Q */ { 4, 10, 6, 1, 4, 8 },
		/* R */ { 8, 0, 4, 0, 6, 11 },
		/* S */ { 9, 4, 0, 6, 3, 10 },
		/* T */ { 7, 6, 7, 11, 5, 3 },
		/* U */ { 11, 9, 6, 3, 11, 1 },
		/* V */ { 11, 11, 2, 8, 1, 0 },
		/* W */ { 6, 0, 11, 6, 11, 2 },
		/* X */ { 4, 2, 7, 2, 8, 10 },
		/* Y */ { 10, 7, 10, 10, 8, 9 },
		/* Z */ { 3, 7, 1, 10, 0, 4 },
		/* 0 */ { 7, 0, 3, 5, 8, 6 },
		/* 1 */ { 9, 10, 10, 9, 1, 2 },
		/* 2 */ { 2, 5, 11, 7, 7, 3 },
		/* 3 */ { 10, 8, 10, 4, 10, 4 },
		/* 4 */ { 6, 8, 0, 3, 5, 0 },
		/* 5 */ { 6, 3, 3, 3, 0, 11 },
		/* 6 */ { 1, 1, 5, 2, 7, 3 },
		/* 7 */ { 0, 6, 2, 4, 2, 1 },
		/* 8 */ { 5, 4, 9, 9, 10, 7 },
		/* 9 */ { 3, 8, 2, 9, 4, 9 },
	};

	@Override
	protected SolveResult<SafetySafeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SafetySafeInput input) {
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.isEmpty()) {
			return failure("Serial number is required.");
		}
		serial = serial.toUpperCase();

		int portTypeCount = getDistinctPortTypeCount(bomb);
		int litMatching = countLitIndicatorsMatchingSerial(bomb, serial);
		int unlitMatching = countUnlitIndicatorsMatchingSerial(bomb, serial);

		int base = 0 + portTypeCount * 7 + litMatching * 5 + unlitMatching;

		List<Integer> dialTurns = new ArrayList<>(6);

		// Dials 1-5: use serial char at position 0-4 and column 0-4
		for (int i = 0; i < 5; i++) {
			char c = i < serial.length() ? serial.charAt(i) : '0';
			int row = charToRowIndex(c);
			int value = TABLE[row][i];
			dialTurns.add(Math.floorMod(base + value, 12));
		}

		// Dial 6: sum of "All" column (index 5) for every character in serial
		int sumAll = 0;
		for (int i = 0; i < serial.length(); i++) {
			int row = charToRowIndex(serial.charAt(i));
			sumAll += TABLE[row][5];
		}
		dialTurns.add(Math.floorMod(base + sumAll, 12));

		return success(new SafetySafeOutput(dialTurns));
	}

	private static int getDistinctPortTypeCount(BombEntity bomb) {
		Set<PortType> distinct = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.collect(Collectors.toSet());
		return distinct.size();
	}

	/** Indicator "matches" if any letter in its label appears in the serial (case-insensitive). */
	private static boolean indicatorMatchesSerial(String indicatorLabel, String serial) {
		if (indicatorLabel == null || indicatorLabel.isEmpty()) return false;
		String upper = indicatorLabel.toUpperCase();
		for (int i = 0; i < upper.length(); i++) {
			char ch = upper.charAt(i);
			if (Character.isLetterOrDigit(ch) && serial.indexOf(ch) >= 0) return true;
		}
		return false;
	}

	private static int countLitIndicatorsMatchingSerial(BombEntity bomb, String serial) {
		int count = 0;
		for (var e : bomb.getIndicators().entrySet()) {
			if (Boolean.TRUE.equals(e.getValue()) && indicatorMatchesSerial(e.getKey(), serial)) count++;
		}
		return count;
	}

	private static int countUnlitIndicatorsMatchingSerial(BombEntity bomb, String serial) {
		int count = 0;
		for (var e : bomb.getIndicators().entrySet()) {
			if (Boolean.FALSE.equals(e.getValue()) && indicatorMatchesSerial(e.getKey(), serial)) count++;
		}
		return count;
	}

	/** A=0..Z=25, 0=26..9=35. Invalid chars default to 0. */
	private static int charToRowIndex(char c) {
		if (c >= 'A' && c <= 'Z') return c - 'A';
		if (c >= 'a' && c <= 'z') return c - 'a';
		if (c >= '0' && c <= '9') return 26 + (c - '0');
		return 0;
	}
}
