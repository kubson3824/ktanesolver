package ktanesolver.module.modded.regular.numbercipher;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

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
	type = ModuleType.THE_NUMBER_CIPHER,
	id = "numberCipher",
	name = "The Number Cipher",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply the Venn-selected formula to three rotating cube digits.",
	tags = {"numbers", "venn-diagram", "lights", "timed-reset"}
)
public class NumberCipherSolver extends AbstractModuleSolver<NumberCipherInput, NumberCipherOutput> {
	private static final Set<String> LIGHTS = Set.of("OFF", "BLUE", "GREEN", "RED");

	@Override
	protected SolveResult<NumberCipherOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, NumberCipherInput input
	) {
		if (input == null || input.digits() == null || input.lights() == null
			|| input.digits().size() != 3 || input.lights().size() != 3) {
			return failure("Enter exactly three cube digits and three light colors");
		}
		if (input.digits().stream().anyMatch(digit -> digit == null || digit < 1 || digit > 9)) {
			return failure("Cube digits must be from 1 through 9");
		}
		List<String> lights = input.lights().stream()
			.map(light -> light == null ? "" : light.trim().toUpperCase(Locale.ROOT)).toList();
		if (lights.stream().anyMatch(light -> !LIGHTS.contains(light))) {
			return failure("Each light must be off, blue, green, or red");
		}

		int a = input.digits().get(0), b = input.digits().get(1), c = input.digits().get(2);
		Set<String> on = new HashSet<>(lights);
		on.remove("OFF");
		String rule;
		int answer;
		if (on.equals(Set.of("BLUE", "GREEN", "RED"))) { rule = "D"; answer = digitalRoot(a * b * c); }
		else if (on.equals(Set.of("BLUE", "GREEN"))) { rule = "F"; answer = (10 * a + b) * c % 10; }
		else if (on.equals(Set.of("BLUE", "RED"))) { rule = "C"; answer = a * (10 * b + c) % 10; }
		else if (on.equals(Set.of("GREEN", "RED"))) { rule = "E"; answer = digitalRoot(a + b * c); }
		else if (on.equals(Set.of("BLUE"))) { rule = "B"; answer = (a + 10 * b + c) % 10; }
		else if (on.equals(Set.of("RED"))) { rule = "A"; answer = digitalRoot(a * b + c); }
		else if (on.equals(Set.of("GREEN"))) { rule = "G"; answer = Math.floorMod(10 * a + b - c, 10); }
		else { rule = "H"; answer = digitalRoot(100 * a + 10 * b + c); }
		return success(new NumberCipherOutput(answer, rule));
	}

	private static int digitalRoot(int number) { return (number - 1) % 9 + 1; }
}
