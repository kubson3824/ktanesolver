package ktanesolver.module.modded.regular.greekcalculus;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.greekcalculus.GreekCalculusInput.DataPoint;
import ktanesolver.module.modded.regular.greekcalculus.GreekCalculusInput.LedColor;

class GreekCalculusSolverTest {
	private final GreekCalculusSolver solver = new GreekCalculusSolver();

	@Test
	void decodesEveryGreekValueIncludingEncodedParameters() {
		BombEntity bomb = bomb();
		List<DataPoint> points = new ArrayList<>();
		points.add(new DataPoint(-1, "10"));
		char[] symbols = "αβγδεζηθικλμνξοπρστυφχψω".toCharArray();
		for (int index = 0; index < symbols.length; index++) points.add(new DataPoint(index, String.valueOf(symbols[index])));

		assertThat(solve(bomb, points, "ω-2", "ξ", LedColor.OTHER)).isEqualTo(new GreekCalculusOutput(174));
	}

	@Test
	void calculatesEveryLedAndRoundsHalfwayValuesToTheGreaterInteger() {
		List<DataPoint> points = List.of(new DataPoint(0, "0"), new DataPoint(1, "1"));
		assertThat(solve(bomb(), points, "0", "1", LedColor.GREEN)).isEqualTo(new GreekCalculusOutput(1));
		assertThat(solve(bomb(), points, "0", "1", LedColor.RED)).isEqualTo(new GreekCalculusOutput(0));
		assertThat(solve(bomb(), points, "0", "1", LedColor.BLUE)).isEqualTo(new GreekCalculusOutput(1));
		assertThat(solve(bomb(), points, "0", "1", LedColor.YELLOW)).isEqualTo(new GreekCalculusOutput(1));
		assertThat(solve(bomb(), points, "1", "0", LedColor.YELLOW)).isEqualTo(new GreekCalculusOutput(0));
		assertThat(solve(bomb(), points, "0", "1", LedColor.OTHER)).isEqualTo(new GreekCalculusOutput(1));
	}

	@Test
	void rejectsInvalidDisplaysAndParametersOutsideTheData() {
		assertThat(result(bomb(), List.of(new DataPoint(0, "not Greek"), new DataPoint(1, "2")), "0", "1", LedColor.RED))
			.isInstanceOf(SolveFailure.class);
		assertThat(result(bomb(), List.of(new DataPoint(0, "1"), new DataPoint(1, "2")), "0", "2", LedColor.RED))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private GreekCalculusOutput solve(BombEntity bomb, List<DataPoint> points, String blue, String yellow, LedColor color) {
		return ((SolveSuccess<GreekCalculusOutput>)result(bomb, points, blue, yellow, color)).output();
	}

	private Object result(BombEntity bomb, List<DataPoint> points, String blue, String yellow, LedColor color) {
		return solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new GreekCalculusInput(points, blue, yellow, color));
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(new LinkedHashMap<>(Map.of("BOB", true, "CAR", true, "FRK", false)));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.SERIAL), Set.of(PortType.DVI)));
		return bomb;
	}
}
