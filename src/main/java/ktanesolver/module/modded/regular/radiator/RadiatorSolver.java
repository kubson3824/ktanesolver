package ktanesolver.module.modded.regular.radiator;

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
	type = ModuleType.RADIATOR,
	id = "radiator",
	name = "Radiator",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the temperature and water values from the bomb's edgework",
	tags = {"edgework", "temperature", "water", "modded"},
	hasInput = false
)
public class RadiatorSolver extends AbstractModuleSolver<RadiatorInput, RadiatorOutput> {
	private static final String SERIAL_CHARACTERS = "RADI4T07";

	@Override
	protected SolveResult<RadiatorOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, RadiatorInput input) {
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.isBlank()) return failure("Serial number is required.");

		if (bomb.isIndicatorLit("FRK") && bomb.isIndicatorLit("BOB")) {
			return success(new RadiatorOutput(13, 37));
		}

		int temperature = Math.abs(
			(int) serial.toUpperCase().chars().filter(c -> SERIAL_CHARACTERS.indexOf(c) >= 0).count() * 10
				+ bomb.getAaBatteryCount() / 2 * 5
				- bomb.getDBatteryCount() * 5
		);

		int water = temperature / 3;
		if (bomb.hasPort(PortType.RJ45)) water += 50;
		if (bomb.getIndicators().containsValue(true)) water += 20;
		if (bomb.isIndicatorUnlit("BOB")) water += 40;
		if (bomb.isIndicatorUnlit("NSA")) water -= 10;
		if (bomb.isIndicatorUnlit("FRQ")) water += 2;
		if (bomb.isIndicatorUnlit("MSA")) water += 25;
		if (bomb.isIndicatorUnlit("FRK")) water -= 1;

		return success(new RadiatorOutput(temperature % 100, Math.abs(water) % 100));
	}
}
