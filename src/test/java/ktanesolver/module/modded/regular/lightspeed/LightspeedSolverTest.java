package ktanesolver.module.modded.regular.lightspeed;

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
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.Point;
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.Symbol;
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.SymbolColor;

class LightspeedSolverTest {
	private final LightspeedSolver solver = new LightspeedSolver();

	@Test
	void solvesWarpDestinationOfficerAndEncryption() {
		BombEntity bomb = new BombEntity();
		bomb.setIndicators(Map.of("SND", true));
		bomb.replacePortPlates(List.of(Set.of(PortType.PARALLEL)));
		var result = solve(bomb, input(List.of("Callinon VII","Gaia IV","Merakord II")));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<LightspeedOutput>) result).output()).isEqualTo(
			new LightspeedOutput("Gamma", 8, "Gaia IV", "L", "Kim, H", "Ensign", "3451")
		);
	}

	@Test
	void rejectsPlanetsOutsideCalculatedQuadrant() {
		assertThat(solve(new BombEntity(), input(List.of("Callinon VII","Gaia IV","Vulcan"))))
			.isInstanceOf(SolveFailure.class);
	}

	private Object solve(BombEntity bomb, LightspeedInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.LIGHTSPEED);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return solver.solve(new RoundEntity(), bomb, module, input);
	}

	private static LightspeedInput input(List<String> planets) {
		return new LightspeedInput(Symbol.C, SymbolColor.YELLOW, Point.NW, 80, 60, 80, 34127, 3, planets,
			List.of("McKenzie, W","Darwin, F","Kim, H","Jetal, A","Torres, B","Data","Sisko, B","Picard, J"));
	}
}
