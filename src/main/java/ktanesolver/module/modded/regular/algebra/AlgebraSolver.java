package ktanesolver.module.modded.regular.algebra;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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
	type = ModuleType.ALGEBRA,
	id = "algebra",
	name = "Algebra",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Solve three increasingly difficult equations using edgework.",
	tags = {"math", "equations", "edgework", "multi-stage", "Souvenir", "modded"}
)
public class AlgebraSolver extends AbstractModuleSolver<AlgebraInput, AlgebraOutput> {
	private static final BigDecimal TWO = BigDecimal.valueOf(2);
	private static final BigDecimal FOUR = BigDecimal.valueOf(4);
	private static final BigDecimal TEN = BigDecimal.TEN;
	private static final Set<Integer> PRIMES = Set.of(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31);

	@Override
	protected SolveResult<AlgebraOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, AlgebraInput input
	) {
		if (input == null || input.equation() == null || input.equation().isBlank()) {
			return failure("Select the equation shown on the module");
		}

		List<String> equations = equationHistory(module);
		int stage = equations.size() + 1;
		if (stage > 3) return failure("All three Algebra stages are already complete");

		String equation = input.equation().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
		BigDecimal x = x(bomb);
		BigDecimal y = y(bomb);
		BigDecimal z = z(bomb);
		BigDecimal answer = switch (stage) {
			case 1 -> stageOne(equation, x, y, z);
			case 2 -> stageTwo(equation, x, y, z);
			default -> stageThree(equation, x, y, z);
		};
		if (answer == null) return failure("Select a valid equation for stage " + stage);

		equations.add(equation);
		storeState(module, Map.of(
			"stage", stage,
			"equations", List.copyOf(equations),
			"x", format(x),
			"y", format(y),
			"z", format(z)
		));
		if (stage == 1) storeState(module, "firstEquation", equation);
		if (stage == 2) storeState(module, "secondEquation", equation);

		return success(new AlgebraOutput(stage, equation, format(answer)), stage == 3);
	}

	private static BigDecimal x(BombEntity bomb) {
		int value = BombEdgeworkUtils.getSerialDigitSum(bomb);
		if (bomb.getBatteryHolders() > 2) value += 2;
		if (bomb.hasPort(PortType.RJ45)) value--;
		if (bomb.isIndicatorLit("BOB")) value += 4;
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (serial.chars().anyMatch(character -> "AEIOU".indexOf(character) >= 0)) value -= 3;
		return BigDecimal.valueOf(value);
	}

	private static BigDecimal y(BombEntity bomb) {
		int digitSum = BombEdgeworkUtils.getSerialDigitSum(bomb);
		int value = bomb.getIndicators().size() - BombEdgeworkUtils.getTotalPortCount(bomb);
		if (bomb.getBatteryHolders() < 3) value -= 2;
		if (bomb.hasPort(PortType.SERIAL)) value += 3;
		if (bomb.isIndicatorUnlit("FRQ")) value -= 5;
		if (PRIMES.contains(digitSum)) value += 4;
		return BigDecimal.valueOf(value);
	}

	private static BigDecimal z(BombEntity bomb) {
		int digitSum = BombEdgeworkUtils.getSerialDigitSum(bomb);
		int value = bomb.getModules().size() + bomb.getAaBatteryCount() * bomb.getDBatteryCount();
		if (bomb.getBatteryHolders() == 0) value += 3;
		if (bomb.hasPort(PortType.PARALLEL)) value -= 6;
		if (bomb.isIndicatorLit("MSA")) value += 2;
		if (digitSum % 3 == 0) value++;
		return BigDecimal.valueOf(value);
	}

	private static BigDecimal stageOne(String equation, BigDecimal x, BigDecimal y, BigDecimal z) {
		return switch (equation) {
			case "a=x+1" -> x.add(BigDecimal.ONE);
			case "a=6-x" -> BigDecimal.valueOf(6).subtract(x);
			case "a=7x" -> x.multiply(BigDecimal.valueOf(7));
			case "a=x/2" -> x.divide(TWO);
			case "a=5+y" -> BigDecimal.valueOf(5).add(y);
			case "a=y-2" -> y.subtract(TWO);
			case "a=8y" -> y.multiply(BigDecimal.valueOf(8));
			case "a=y/4" -> y.divide(FOUR);
			case "a=9+z" -> BigDecimal.valueOf(9).add(z);
			case "a=z-7" -> z.subtract(BigDecimal.valueOf(7));
			case "a=3z" -> z.multiply(BigDecimal.valueOf(3));
			case "a=z/10" -> z.divide(TEN);
			default -> null;
		};
	}

	private static BigDecimal stageTwo(String equation, BigDecimal x, BigDecimal y, BigDecimal z) {
		return switch (equation) {
			case "b=xy-(2+x)" -> x.multiply(y).subtract(TWO.add(x));
			case "b=(2x/10)-y" -> TWO.multiply(x).divide(TEN).subtract(y);
			case "b=(z-y)/2" -> z.subtract(y).divide(TWO);
			case "b=xyz" -> x.multiply(y).multiply(z);
			case "b=(y/2)-z" -> y.divide(TWO).subtract(z);
			case "b=(zy)-(2x)" -> z.multiply(y).subtract(TWO.multiply(x));
			case "b=(x+y)-(z/2)" -> x.add(y).subtract(z.divide(TWO));
			case "b=(7x)y" -> BigDecimal.valueOf(7).multiply(x).multiply(y);
			case "b=2z+7" -> TWO.multiply(z).add(BigDecimal.valueOf(7));
			case "b=2(z+7)" -> TWO.multiply(z.add(BigDecimal.valueOf(7)));
			default -> null;
		};
	}

	private static BigDecimal stageThree(String equation, BigDecimal x, BigDecimal y, BigDecimal z) {
		return switch (equation) {
			case "x-2y=c-z" -> x.subtract(TWO.multiply(y)).add(z);
			case "xy=z+(c/10)" -> x.multiply(y).subtract(z).multiply(TEN);
			case "(y/2)+7=4c+z" -> y.divide(TWO).add(BigDecimal.valueOf(7)).subtract(z).divide(FOUR);
			case "8x-z=c-y" -> BigDecimal.valueOf(8).multiply(x).subtract(z).add(y);
			case "3x-(2+y)/10=z/4-c" -> TWO.add(y).divide(TEN).subtract(BigDecimal.valueOf(3).multiply(x)).add(z.divide(FOUR));
			case "9y/2=c-xy/4" -> BigDecimal.valueOf(9).multiply(y).divide(TWO).add(x.multiply(y).divide(FOUR));
			case "x(y/2)+11=(4+c)/2y" -> y.signum() == 0 ? null
				: x.multiply(y.divide(TWO)).add(BigDecimal.valueOf(11)).multiply(TWO.multiply(y)).subtract(FOUR);
			case "z/2-x/4=4c-z" -> z.divide(TWO).subtract(x.divide(FOUR)).add(z).divide(FOUR);
			default -> null;
		};
	}

	private static List<String> equationHistory(ModuleEntity module) {
		Object saved = module.getState().get("equations");
		if (!(saved instanceof List<?> list)) return new ArrayList<>();
		return new ArrayList<>(list.stream().map(String::valueOf).toList());
	}

	private static String format(BigDecimal value) {
		return value.stripTrailingZeros().toPlainString();
	}
}
