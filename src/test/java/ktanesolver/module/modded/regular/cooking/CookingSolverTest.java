package ktanesolver.module.modded.regular.cooking;

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
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class CookingSolverTest {
	private final CookingSolver solver = new CookingSolver();

	@Test
	void derivesEveryPersonRouteAndWrapsMealAndSettingCalculations() {
		assertThat(solve(bomb("BC1DF2", 0, 1, Map.of("FRK", true, "FRQ", true),
			List.of(Set.of(PortType.SERIAL), Set.of()))))
			.isEqualTo(new CookingOutput("Chicken Casserole", 200, "FAN_WITH_GRILL", false, "Harry", 45));
		assertThat(solve(bomb("BC1DF2", 0, 1, Map.of("FRQ", true), List.of(Set.of()))))
			.isEqualTo(new CookingOutput("Chilli Con Carne", 180, "GRILL", false, "James", 95));
		assertThat(solve(bomb("A12345", 0, 0, Map.of("SND", false), List.of())))
			.isEqualTo(new CookingOutput("Chilli Con Carne", 180, "FAN_WITH_GRILL", true, "Tom", 35));
		assertThat(solve(bomb("BC1DF2", 0, 1, Map.of(),
			List.of(Set.of(PortType.COMPOSITE_VIDEO, PortType.PS2)))))
			.isEqualTo(new CookingOutput("Spaghetti Bolognese", 160, "FAN_OVEN", true, "Erik", 75));
		assertThat(solve(bomb("BC1DF2", 0, 1, Map.of(), List.of(Set.of(PortType.HDMI)))))
			.isEqualTo(new CookingOutput("Pizza", 250, "FAN_OVEN", false, "Erik", 5));
		assertThat(solve(bomb("BC1DF2", 0, 0, Map.of("BOB", false), List.of())))
			.isEqualTo(new CookingOutput("Chilli Con Carne", 180, "CONVENTIONAL_HEATING", false, "Bob", 90));
		assertThat(solve(bomb("BC1DF2", 0, 0, Map.of(), List.of())))
			.isEqualTo(new CookingOutput("Chicken Pie", 180, "FAN_OVEN", false, "Markus", 35));

		assertThat(solver.solve(new RoundEntity(), bomb("BAD", 0, 0, Map.of(), List.of()),
			module(), new CookingInput())).isInstanceOf(SolveFailure.class);
	}

	private CookingOutput solve(BombEntity bomb) {
		ModuleEntity module = module();
		var result = solver.solve(new RoundEntity(), bomb, module, new CookingInput());
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		return ((SolveSuccess<CookingOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.COOKING);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static BombEntity bomb(
		String serial, int aaBatteries, int dBatteries, Map<String, Boolean> indicators,
		List<Set<PortType>> portPlates
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aaBatteries);
		bomb.setDBatteryCount(dBatteries);
		bomb.setIndicators(new HashMap<>(indicators));
		bomb.replacePortPlates(portPlates);
		return bomb;
	}
}
