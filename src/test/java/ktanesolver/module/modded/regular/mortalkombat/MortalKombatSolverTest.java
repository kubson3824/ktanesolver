package ktanesolver.module.modded.regular.mortalkombat;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
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

class MortalKombatSolverTest {
	private final MortalKombatSolver solver = new MortalKombatSolver();

	@Test
	void calculatesMoveOrderAndPrioritizedFatalities() {
		MortalKombatOutput johnny = solve(bomb("ABC124", 1, 0, Map.of(), PortType.PARALLEL), "Johnny Cage", "Kano");
		assertThat(johnny.attacks()).extracting(MortalKombatOutput.Move::name)
			.containsExactly("Green Fireball", "Nut Cracker", "Shadow Kick");
		assertThat(johnny.fatality().name()).isEqualTo("Deadly Uppercut");

		assertThat(solve(bomb("ABC124", 1, 0, Map.of()), "Johnny Cage", "Kano").fatality().name()).isEqualTo("Stage");
		assertThat(solve(bomb("BCD246", 0, 2, Map.of("SND", false)), "Kano", "Johnny Cage").fatality().name()).isEqualTo("Heart Rip");
		assertThat(solve(bomb("BCD113", 1, 1, Map.of()), "Liu Kang", "Scorpion").fatality().name()).isEqualTo("Butterfly Flip");
		assertThat(solve(bomb("LBC246", 4, 2, Map.of()), "Raiden", "Johnny Cage").fatality().name()).isEqualTo("Explosive Uppercut");
		assertThat(solve(bomb("BCD135", 4, 1, Map.of()), "Scorpion", "Johnny Cage").fatality().name()).isEqualTo("Spear Slice");
		assertThat(solve(bomb("BCD612", 0, 0, Map.of(), PortType.DVI), "Sonya Blade", "Raiden").fatality().name()).isEqualTo("Crush Kiss");
		assertThat(solve(bomb("BCD124", 1, 1, Map.of("CAR", false)), "Sub-Zero", "Raiden").fatality().name()).isEqualTo("Spine Rip");
	}

	@SuppressWarnings("unchecked")
	private MortalKombatOutput solve(BombEntity bomb, String player, String opponent) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<MortalKombatOutput>) solver.solve(
			new RoundEntity(), bomb, module, new MortalKombatInput(player, opponent)
		)).output();
	}

	private static BombEntity bomb(String serial, int aa, int d, Map<String, Boolean> indicators, PortType... ports) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(indicators);
		List<PortPlateEntity> plates = new ArrayList<>();
		for (PortType port : ports) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setPorts(Set.of(port));
			plates.add(plate);
		}
		bomb.setPortPlates(plates);
		return bomb;
	}
}
