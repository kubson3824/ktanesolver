package ktanesolver.module.modded.regular.burglaralarm;

import java.util.List;

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
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.BURGLAR_ALARM,
	id = "burglarAlarm",
	name = "Burglar Alarm",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the eight-digit disarm code from the display and bomb edgework",
	tags = {"digits", "edgework", "timed", "modded"}
)
public class BurglarAlarmSolver extends AbstractModuleSolver<BurglarAlarmInput, BurglarAlarmOutput> {

	@Override
	protected SolveResult<BurglarAlarmOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BurglarAlarmInput input
	) {
		if (input == null || input.moduleNumber() == null || !input.moduleNumber().matches("[0-9]{8}")) {
			return failure("Enter the eight digits displayed on the module");
		}

		List<Integer> digits = input.moduleNumber().chars().map(c -> c - '0').boxed().toList();
		int batteries = bomb.getBatteryCount();
		int ports = BombEdgeworkUtils.getTotalPortCount(bomb);
		int indicators = bomb.getIndicators().size();
		int solved = BombEdgeworkUtils.countSolvedModules(bomb);
		long lit = BombEdgeworkUtils.getLitIndicatorCount(bomb);
		long unlit = BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase();
		StringBuilder code = new StringBuilder(8);

		for (int position = 0; position < digits.size(); position++) {
			int offset = switch (position) {
				case 0 -> batteries > ports
					? (bomb.getBatteryHolders() % 2 == 0 ? 9 : 1)
					: (digits.get(7) % 2 == 0 ? 3 : 4);
				case 1 -> bomb.hasPort(PortType.PS2)
					? (BombEdgeworkUtils.serialHasMoreLettersThanDigits(bomb) ? 0 : 6)
					: (bomb.isIndicatorLit("BOB") ? 5 : 2);
				case 2 -> solved % 2 == 0
					? (digits.get(2) % 2 == 0 ? 8 : 4)
					: (bomb.hasPort(PortType.RJ45) ? 9 : 3);
				case 3 -> digits.stream().mapToInt(Integer::intValue).sum() % 2 == 1
					? (bomb.getPortPlates().size() > indicators ? 7 : 3)
					: (bomb.getDBatteryCount() > bomb.getAaBatteryCount() ? 7 : 2);
				case 4 -> solved > batteries * bomb.getPortPlates().size()
					? (ports % 2 == 0 ? 9 : 3)
					: (ports > indicators ? 7 : 8);
				case 5 -> bomb.hasPort(PortType.PARALLEL)
					? (bomb.hasPort(PortType.SERIAL) ? 1 : 5)
					: (bomb.isIndicatorLit("FRQ") ? 0 : 4);
				case 6 -> batteries > 4 ? (unlit == 0 ? 2 : 6) : (lit == 0 ? 4 : 9);
				case 7 -> indicators == batteries
					? (serial.chars().anyMatch(c -> "BURGL14".indexOf(c) >= 0) ? 1 : 0)
					: (serial.chars().anyMatch(c -> "AL53M".indexOf(c) >= 0) ? 0 : 8);
				default -> throw new IllegalStateException();
			};
			code.append((digits.get(position) + offset) % 10);
		}

		storeState(module, "moduleNumber", digits);
		return success(new BurglarAlarmOutput(code.toString()));
	}
}
