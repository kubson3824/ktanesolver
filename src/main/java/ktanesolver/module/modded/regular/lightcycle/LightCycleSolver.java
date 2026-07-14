package ktanesolver.module.modded.regular.lightcycle;

import java.util.ArrayList;
import java.util.Collections;
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
	type = ModuleType.LIGHT_CYCLE,
	id = "light-cycle",
	name = "Light Cycle",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Reorder the six flashing colors using the bomb serial number.",
	tags = {"colors", "sequence", "serial number"}
)
public class LightCycleSolver extends AbstractModuleSolver<LightCycleInput, LightCycleOutput> {
	private static final String CODES = "RYGBMW";
	private static final List<String> COLORS = List.of("RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE");
	private static final String[] TABLE = """
		5BBRMGY541RW6416233MGYW2
		2R6M435BR5Y21GMYW634BWG1
		MY24YR35W2GB1WR35G46BM61
		566314M2RY2MWRBGYW3BG145
		BRW22314MB56YWRMGY6G3541
		RY2G1MY55RWB63B1M4G6324W
		Y1542WRY1RB36GG6MBW5423M
		35WYG22B5GMRB31446YM6WR1
		RM455WB1M632WBGYYR146G23
		WBR65Y4125Y3MW32BGGM1R64
		64B2WGR5G12YYRMB163W534M
		64B5W61GR24RGW3M2BY35YM1
		W33G24YMM2R56RB6GY5B1W41
		1Y6M21GR3G5BR443W2YWB5M6
		R53G23W4B21M56M14YGB6RYW
		144B623WMRY6BY2G5MG5R3W1
		5GMB4WY2RMW46136BY15GR23
		MG56GMW5Y2R4B11B2R436W3Y
		RY655GGBWM431WB13624Y2MR
		G3B26WMB15Y45MWR463Y2GR1
		51W34534YW1YBG62M6GR2MRB
		M66B1G35WRB4GMR12W524YY3
		YMB1532G32R514W64WGRMY6B
		42RBW5YM2Y51BRG3MG366W14
		GY1R544G3BM625Y2R1W3BW6M
		GBBG15M13MR3YW6Y5246WR24
		2RRB5GW2Y14Y351MBWG664M3
		R4W6322W4Y65BR5GYBGMM113
		4BB364W1MYR6G5YW522R3G1M
		B6M34B1425Y1GYRWWG526M3R
		MR2BW56YB342G1Y65G3MRW14
		Y1561WW4BGG54M2B3R63M2RY
		34WBYG5MR1GW126YBRM64325
		4G65Y4GB31MY531M2RR2BWW6
		YBR2WR531W35BMG46Y4G21M6
		GY315MR26WMBY6244GB51RW3
		""".strip().split("\\R");

	@Override
	protected SolveResult<LightCycleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LightCycleInput input
	) {
		if (input == null || input.initialColors() == null || input.initialColors().size() != 6) {
			return failure("Light Cycle requires exactly six colors");
		}

		List<String> colors = input.initialColors().stream()
			.map(color -> color == null ? "" : color.toUpperCase(Locale.ROOT))
			.toList();
		if (colors.stream().anyMatch(color -> !COLORS.contains(color)) || colors.stream().distinct().count() != 6) {
			return failure("Use each Light Cycle color exactly once");
		}

		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (!serial.matches("[A-Z0-9]{6}")) {
			return failure("Bomb serial number must contain exactly six letters or digits");
		}

		List<Character> sequence = new ArrayList<>(colors.stream().map(color -> CODES.charAt(COLORS.indexOf(color))).toList());
		for (int i = 0; i < 6; i++) {
			int offset = characterIndex(serial.charAt(5 - i)) / 3 * 2;
			String row = TABLE[characterIndex(serial.charAt(i))];
			Collections.swap(sequence, resolve(row.charAt(offset), sequence), resolve(row.charAt(offset + 1), sequence));
		}

		List<String> solution = sequence.stream().map(code -> COLORS.get(CODES.indexOf(code))).toList();
		storeState(module, "input", new LightCycleInput(colors));
		return success(new LightCycleOutput(solution));
	}

	private static int characterIndex(char character) {
		return Character.isLetter(character) ? character - 'A' : character - '0' + 26;
	}

	private static int resolve(char value, List<Character> sequence) {
		int color = CODES.indexOf(value);
		return color >= 0 ? sequence.indexOf(value) : value - '1';
	}
}
