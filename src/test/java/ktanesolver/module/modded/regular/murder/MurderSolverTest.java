package ktanesolver.module.modded.regular.murder;

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
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.murder.MurderInput.Location;
import ktanesolver.module.modded.regular.murder.MurderInput.Suspect;
import ktanesolver.module.modded.regular.murder.MurderInput.Weapon;

class MurderSolverTest {
	private final MurderSolver solver = new MurderSolver();

	@Test
	void solvesUsingTheFirstMatchingAvailableAccusation() {
		BombEntity bomb = bomb(1, 1, Map.of("SND", true), List.of());
		MurderInput input = new MurderInput(Location.KITCHEN,
			List.of(Suspect.MISS_SCARLETT, Suspect.PROFESSOR_PLUM, Suspect.MRS_PEACOCK, Suspect.REVEREND_GREEN),
			List.of(Weapon.CANDLESTICK, Weapon.DAGGER, Weapon.REVOLVER, Weapon.SPANNER));

		MurderOutput output = solve(bomb, input);

		assertThat(output).isEqualTo(new MurderOutput(Suspect.REVEREND_GREEN, Weapon.DAGGER, Location.STUDY));
	}

	@Test
	void countsRcaPortsAcrossPlatesAndHonorsRulePriority() {
		BombEntity bomb = bomb(2, 1, Map.of("TRN", true), List.of(Set.of(PortType.STEREO_RCA), Set.of(PortType.STEREO_RCA)));
		MurderInput input = new MurderInput(Location.KITCHEN,
			List.of(Suspect.MISS_SCARLETT, Suspect.PROFESSOR_PLUM, Suspect.REVEREND_GREEN, Suspect.COLONEL_MUSTARD),
			List.of(Weapon.CANDLESTICK, Weapon.DAGGER, Weapon.LEAD_PIPE, Weapon.SPANNER));

		MurderOutput output = solve(bomb, input);

		assertThat(output).isEqualTo(new MurderOutput(Suspect.MISS_SCARLETT, Weapon.LEAD_PIPE, Location.BILLIARD_ROOM));
	}

	@Test
	void rejectsIncompleteDisplays() {
		ModuleEntity module = module();
		SolveResult<MurderOutput> result = solver.solve(new RoundEntity(), bomb(0, 0, Map.of(), List.of()), module,
			new MurderInput(Location.STUDY, List.of(Suspect.MISS_SCARLETT), List.of(Weapon.DAGGER)));

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<MurderOutput>) result).getReason()).isEqualTo("Select the four suspects shown on the module");
	}

	private MurderOutput solve(BombEntity bomb, MurderInput input) {
		ModuleEntity module = module();
		SolveResult<MurderOutput> result = solver.solve(new RoundEntity(), bomb, module, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		return ((SolveSuccess<MurderOutput>) result).output();
	}

	private static BombEntity bomb(int aa, int d, Map<String, Boolean> indicators, List<Set<PortType>> ports) {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(new HashMap<>(indicators));
		for(Set<PortType> types : ports) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setPorts(types);
			bomb.getPortPlates().add(plate);
		}
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MURDER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
