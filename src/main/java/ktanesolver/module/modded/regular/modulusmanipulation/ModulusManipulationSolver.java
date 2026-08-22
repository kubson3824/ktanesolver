package ktanesolver.module.modded.regular.modulusmanipulation;

import java.util.Locale;

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
	type = ModuleType.MODULUS_MANIPULATION,
	id = "modulusManipulation",
	name = "Modulus Manipulation",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply the active unsolved-module rule sets to the serial-number value.",
	tags = {"numbers", "modulo", "serial number", "dynamic edgework"}
)
public class ModulusManipulationSolver extends AbstractModuleSolver<ModulusManipulationInput, ModulusManipulationOutput> {
	@Override
	protected SolveResult<ModulusManipulationOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ModulusManipulationInput input) {
		if (input == null || input.minutesRemaining() < 0) return failure("Enter the current whole minutes remaining");
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.length() < 3) return failure("A serial number with at least three characters is required");
		int starting = 0;
		for (int i = 0; i < 3; i++) starting = starting * 10 + characterDigit(serial.charAt(i));
		int other = (int) bomb.getModules().stream().filter(candidate -> candidate != module && !candidate.isSolved() && candidate.getType() != null && !candidate.getType().isNeedy()).count();
		int answer = starting;
		int batteries = bomb.getBatteryCount();
		long lit = BombEdgeworkUtils.getLitIndicatorCount(bomb), unlit = BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		if (other % 5 == 0) { if (batteries > 1) answer += 400; if (serial.matches(".*[36].*")) answer -= 40; }
		if (other % 4 == 0) { if (bomb.getAaBatteryCount() >= 1 && bomb.getDBatteryCount() >= 1) answer *= 2; if (serial.chars().filter(Character::isLetter).count() == 4) answer -= 290; }
		if (other % 3 == 0) { if (batteries > 3) answer -= 160; if (lit > unlit) answer += 75; }
		if (other % 2 == 0) {
			if (bomb.serialHasVowel()) answer += 340;
			if (bomb.hasPort(PortType.PS2) || bomb.hasPort(PortType.RJ45) || bomb.hasPort(PortType.SERIAL)) answer += 180;
		}
		if (bomb.getStrikes() >= 1) answer -= 45;
		if (unlit > 0) answer -= 15;
		if (bomb.isLastDigitEven()) answer += 150;
		if (input.minutesRemaining() % 2 == 0) answer += 6;
		answer = answer < 0 ? 0 : answer % 1000;
		return success(new ModulusManipulationOutput(starting, other, answer, String.format(Locale.ROOT, "%03d", answer), input.minutesRemaining()));
	}

	private static int characterDigit(char character) { return Character.isDigit(character) ? character - '0' : (Character.toUpperCase(character) - 'A' + 1) % 10; }
}
