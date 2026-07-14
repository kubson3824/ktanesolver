package ktanesolver.module.modded.regular.creation;

import static ktanesolver.module.modded.regular.creation.CreationInput.Element.*;
import static ktanesolver.module.modded.regular.creation.CreationInput.Weather.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.creation.CreationInput.Element;

class CreationSolverTest {
	private static final List<Element> BASES = List.of(WATER, AIR, EARTH, FIRE);
	private final CreationSolver solver = new CreationSolver();

	@Test
	void followsWeatherAdjustedRecipesAndReplacesTheSouvenirWeatherOnReset() {
		BombEntity bomb = bomb(6, 0, Map.of("IND", true));
		ModuleEntity module = new ModuleEntity();

		assertThat(solve(bomb, module, new CreationInput(RAIN, List.of(EARTH, WATER, AIR, FIRE), false)))
			.isEqualTo(new CreationOutput(1, 5, DINOSAUR, FIRE, EARTH, SWAMP));
		assertThat(solve(bomb, module, new CreationInput(CLEAR, null, false)).creates()).isEqualTo(ENERGY);
		assertThat(solve(bomb, module, new CreationInput(CLEAR, null, false)).creates()).isEqualTo(LIFE);
		assertThat(solve(bomb, module, new CreationInput(METEOR_SHOWER, null, false)))
			.isEqualTo(new CreationOutput(4, 5, DINOSAUR, AIR, LIFE, EGG));
		assertThat(solve(bomb, module, new CreationInput(CLEAR, null, false)).creates()).isEqualTo(DINOSAUR);
		assertThat(module.isSolved()).isTrue();

		ModuleEntity resetModule = new ModuleEntity();
		solve(bomb, resetModule, new CreationInput(CLEAR, BASES, false));
		CreationOutput restarted = solve(bomb, resetModule, new CreationInput(HEAT_WAVE, BASES, true));
		assertThat(restarted.target()).isEqualTo(DINOSAUR);
		assertThat(resetModule.getState().get("firstWeather")).isEqualTo("Heat Wave");
		assertThat(resetModule.getState().get("day")).isEqualTo(2);
	}

	@Test
	void selectsTargetsFromEveryEdgeworkBranch() {
		assertTarget(bomb(6, 0, Map.of("IND", true)), BIRD);
		assertTarget(bomb(4, 1, Map.of("IND", true)), DINOSAUR);
		assertTarget(bomb(0, 3, Map.of("IND", false)), TURTLE);
		assertTarget(bomb(2, 2, Map.of("IND", false)), LIZARD);
		assertTarget(bomb(6, 0, Map.of()), WORM);

		BombEntity extraPlates = bomb(2, 0, Map.of());
		extraPlates.setPortPlates(List.of(plate(PortType.DVI), plate(PortType.PARALLEL)));
		assertTarget(extraPlates, GHOST);

		BombEntity duplicatePort = bomb(4, 0, Map.of());
		duplicatePort.setPortPlates(List.of(plate(PortType.DVI), plate(PortType.DVI)));
		assertTarget(duplicatePort, PLANKTON);
		assertTarget(bomb(4, 0, Map.of("IND", false)), SEEDS);
		assertTarget(bomb(4, 0, Map.of()), MUSHROOM);
	}

	private void assertTarget(BombEntity bomb, Element expected) {
		assertThat(solve(bomb, new ModuleEntity(), new CreationInput(CLEAR, BASES, false)).target()).isEqualTo(expected);
	}

	@SuppressWarnings("unchecked")
	private CreationOutput solve(BombEntity bomb, ModuleEntity module, CreationInput input) {
		return ((SolveSuccess<CreationOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(int aa, int d, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(indicators);
		return bomb;
	}

	private static PortPlateEntity plate(PortType... ports) {
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(Set.of(ports)));
		return plate;
	}
}
