package ktanesolver.module.modded.regular.blindalley;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.BLIND_ALLEY,
	id = "blind-alley",
	name = "Blind Alley",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which invisible regions have the most matching edgework conditions",
	tags = {"blank", "edgework", "regions", "modded"},
	hasInput = false
)
public class BlindAlleySolver extends AbstractModuleSolver<BlindAlleyInput, BlindAlleyOutput> {
	private static final List<String> REGION_NAMES = List.of("TL", "TM", "ML", "MC", "MR", "BL", "BM", "BR");

	@Override
	protected SolveResult<BlindAlleyOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BlindAlleyInput input) {
		int[] counts = {
			count(bomb.isIndicatorUnlit("BOB"), bomb.isIndicatorLit("CAR"), bomb.isIndicatorLit("IND"), bomb.getBatteryHolders() % 2 == 0),
			count(bomb.isIndicatorUnlit("CAR"), bomb.isIndicatorUnlit("NSA"), bomb.isIndicatorLit("FRK"), bomb.hasPort(PortType.RJ45)),
			count(bomb.isIndicatorUnlit("FRQ"), bomb.isIndicatorUnlit("IND"), bomb.isIndicatorUnlit("TRN"), bomb.hasPort(PortType.DVI)),
			count(bomb.isIndicatorUnlit("SIG"), bomb.isIndicatorUnlit("SND"), bomb.isIndicatorLit("NSA"), bomb.getBatteryCount() % 2 == 0),
			count(bomb.isIndicatorLit("BOB"), bomb.isIndicatorLit("CLR"), bomb.hasPort(PortType.PS2), bomb.hasPort(PortType.SERIAL)),
			count(bomb.isIndicatorLit("FRQ"), bomb.isIndicatorLit("SIG"), bomb.isIndicatorLit("TRN"), bomb.getSerialNumber().chars().anyMatch(c -> Character.isDigit(c) && (c - '0') % 2 == 0)),
			count(bomb.isIndicatorUnlit("FRK"), bomb.isIndicatorLit("MSA"), bomb.hasPort(PortType.PARALLEL), bomb.serialHasVowel()),
			count(bomb.isIndicatorUnlit("CLR"), bomb.isIndicatorUnlit("MSA"), bomb.isIndicatorLit("SND"), bomb.hasPort(PortType.STEREO_RCA))
		};
		int highest = java.util.Arrays.stream(counts).max().orElse(0);
		Map<String, Integer> conditionCounts = new LinkedHashMap<>();
		for (int i = 0; i < counts.length; i++) conditionCounts.put(REGION_NAMES.get(i), counts[i]);
		List<String> regions = REGION_NAMES.stream().filter(name -> conditionCounts.get(name) == highest).toList();
		return success(new BlindAlleyOutput(regions, conditionCounts));
	}

	private static int count(boolean... conditions) {
		int total = 0;
		for (boolean condition : conditions) if (condition) total++;
		return total;
	}
}
