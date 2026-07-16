package ktanesolver.module.modded.regular.icecream;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class IceCreamSolverTest {
	private static final List<String> EDGEWORK_FLAVORS = List.of(
		"Raspberry Ripple", "Double Chocolate", "Double Strawberry", "The Classic", "Vanilla"
	);
	private final IceCreamSolver solver = new IceCreamSolver();

	@Test
	void appliesEveryEdgeworkPriorityAndCustomerAllergy() {
		BombEntity lit = bomb();
		lit.setIndicators(Map.of("CAR", true));
		assertThat(solve(lit, module(), "Tom", EDGEWORK_FLAVORS, false).flavor()).isEqualTo("The Classic");

		BombEntity emptyPlate = bomb();
		emptyPlate.setPortPlates(List.of(new PortPlateEntity()));
		assertThat(solve(emptyPlate, module(), "Tom", EDGEWORK_FLAVORS, false).flavor()).isEqualTo("Double Chocolate");

		BombEntity batteries = bomb();
		batteries.setAaBatteryCount(3);
		assertThat(solve(batteries, module(), "Tom", EDGEWORK_FLAVORS, false).flavor()).isEqualTo("Raspberry Ripple");
		assertThat(solve(bomb(), module(), "Tom", EDGEWORK_FLAVORS, false).flavor()).isEqualTo("Double Strawberry");

		assertThat(solve(lit, module(), "Mike", List.of(
			"Neapolitan", "Tutti Frutti", "The Classic", "Raspberry Ripple", "Vanilla"
		), false).flavor()).isEqualTo("Raspberry Ripple");
	}

	@Test
	void replacesTheCurrentStageAfterAStrike() {
		ModuleEntity module = module();
		solve(bomb(), module, "Tom", EDGEWORK_FLAVORS, false);
		IceCreamOutput replacement = solve(bomb(), module, "Tim", EDGEWORK_FLAVORS, true);

		assertThat(replacement.stage()).isEqualTo(1);
		assertThat((List<?>) module.getState().get("stages")).singleElement()
			.asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
			.containsEntry("customer", "Tim");
	}

	@SuppressWarnings("unchecked")
	private IceCreamOutput solve(BombEntity bomb, ModuleEntity module, String customer, List<String> flavors, boolean reset) {
		return ((SolveSuccess<IceCreamOutput>) solver.solve(
			new RoundEntity(), bomb, module, new IceCreamInput(customer, flavors, reset))).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC120");
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
