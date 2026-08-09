package ktanesolver.module.modded.regular.mineseeker;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MineseekerSolverTest {
	private final MineseekerSolver solver = new MineseekerSolver();

	@Test
	void calculatesTheDestinationAndFindsAValidShortestRoute() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("CAR", true, "NSA", false));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of());
		bomb.setPortPlates(List.of(plate));

		SolveSuccess<MineseekerOutput> result = solve(bomb, new MineseekerInput("85", "WHITE", List.of(123456)));
		assertThat(result.output()).isEqualTo(new MineseekerOutput(1, "11", List.of("R", "R", "R", "D")));
	}

	@Test
	void appliesSerialCollisionsThenTheNegativeFallbackAndAcceptsAnEmptyRoute() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A10BC2");
		bomb.setIndicators(Map.of("A", true));
		SolveSuccess<MineseekerOutput> result = solve(bomb, new MineseekerInput("11", "WHITE", List.of()));
		assertThat(result.output().calculatedNumber()).isEqualTo(1);
		assertThat(result.output().destinationImage()).isEqualTo("11");
		assertThat(result.output().moves()).isEmpty();
	}

	@Test
	void rejectsImpossibleStartingPairsAndInvalidTwoFactorCodes() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		assertThat(solver.solve(new RoundEntity(), bomb, module(), new MineseekerInput("6", "WHITE", List.of())))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb, module(), new MineseekerInput("85", "WHITE", List.of(1_000_000))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<MineseekerOutput> solve(BombEntity bomb, MineseekerInput input) {
		return (SolveSuccess<MineseekerOutput>) solver.solve(new RoundEntity(), bomb, module(), input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MINESEEKER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
