package ktanesolver.module.modded.regular.colormath;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class ColorMathSolverTest {
	private static final List<String> ZERO = List.of("MAGENTA", "RED", "WHITE", "GRAY");
	private final ColorMathSolver solver = new ColorMathSolver();

	@Test
	void decodesBothBanksAndConvertsTheAnswerToColors() {
		ColorMathOutput output = solve(
			new BombEntity(),
			List.of("GREEN", "BLACK", "ORANGE", "WHITE"),
			List.of("PURPLE", "BLACK", "MAGENTA", "WHITE"),
			"GREEN", "A"
		);

		assertThat(output).isEqualTo(new ColorMathOutput(
			1234, 5678, 6912, List.of("MAGENTA", "WHITE", "YELLOW", "PURPLE")
		));
	}

	@Test
	void appliesAbsoluteSubtractionIntegerDivisionAndModulo() {
		assertThat(solve(new BombEntity(), ZERO, List.of("BLUE", "YELLOW", "YELLOW", "YELLOW"), "GREEN", "S").answer())
			.isEqualTo(49);
		assertThat(solve(new BombEntity(), List.of("GREEN", "BLACK", "ORANGE", "WHITE"), List.of("BLUE", "YELLOW", "GREEN", "BLUE"), "GREEN", "D").answer())
			.isEqualTo(246);
		assertThat(solve(new BombEntity(), List.of("ORANGE", "RED", "WHITE", "GRAY"), List.of("BLUE", "YELLOW", "GREEN", "PURPLE"), "GREEN", "M").answer())
			.isEqualTo(0);
	}

	@Test
	void buildsTheRedOperandForEveryBatteryTier() {
		BombEntity zeroToOne = bomb("A1BC23", 1, 0, Map.of("CAR", false, "FRK", false), List.of(Set.of(PortType.RJ45), Set.of(PortType.RJ45)));
		BombEntity twoToThree = bomb("ABC123", 2, 0, Map.of(), List.of(Set.of(PortType.PS2), Set.of(PortType.PS2)));
		BombEntity fourToFive = bomb("AEI123", 4, 0, Map.of(), List.of(Set.of(PortType.SERIAL), Set.of(PortType.SERIAL)));
		BombEntity sixPlus = bomb("AEBC12", 6, 0, Map.of("CAR", true, "FRK", true), List.of(Set.of(PortType.DVI), Set.of(PortType.DVI)));

		assertThat(solve(zeroToOne, ZERO, List.of(), "RED", "A").operand()).isEqualTo(1292);
		assertThat(solve(twoToThree, ZERO, List.of(), "RED", "A").operand()).isEqualTo(233);
		assertThat(solve(fourToFive, ZERO, List.of(), "RED", "A").operand()).isEqualTo(3224);
		assertThat(solve(sixPlus, ZERO, List.of(), "RED", "A").operand()).isEqualTo(2522);
	}

	@SuppressWarnings("unchecked")
	private ColorMathOutput solve(BombEntity bomb, List<String> left, List<String> right, String display, String operation) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.COLOR_MATH);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<ColorMathOutput>) solver.solve(
			new RoundEntity(), bomb, module, new ColorMathInput(left, right, display, operation)
		)).output();
	}

	private static BombEntity bomb(
		String serial, int aa, int d, Map<String, Boolean> indicators, List<Set<PortType>> ports
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(new HashMap<>(indicators));
		bomb.replacePortPlates(ports);
		return bomb;
	}
}
