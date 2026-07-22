package ktanesolver.module.modded.regular.skyrim;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SkyrimSolverTest {
	private final SkyrimSolver solver = new SkyrimSolver();
	private final SkyrimInput input = new SkyrimInput(
		List.of("Nord", "Imperial", "Dunmer"),
		List.of("Mace of Molag Bal", "Firiniel's End", "Volendrung"),
		List.of("Frost Troll", "Mudcrab", "Dragon Priest"),
		List.of("Windhelm", "Winterhold", "Solitude"),
		List.of("Disarm", "Whirlwind Sprint", "Slow Time"));

	@Test
	void solvesEveryBatteryAndFirstSerialCharacterBranchAndRecordsSouvenirChoices() {
		ModuleEntity letterModule = new ModuleEntity();
		assertThat(solve(2, "A1B2C3", letterModule)).isEqualTo(new SolveSuccess<>(
			new SkyrimOutput("Nord", "Mace of Molag Bal", "Frost Troll", "Windhelm", "Disarm"), true));
		assertThat(letterModule.getState())
			.containsEntry("weapons", List.of("Mace of Molag Bal", "Firiniel’s End", "Volendrung"))
			.containsEntry("dragonShouts", List.of("zun hal vik", "wuld nah kest", "tid klo ul"))
			.containsEntry("correctDragonShout", "zun hal vik");

		assertThat(solve(4, "1AB2C3", new ModuleEntity())).isEqualTo(new SolveSuccess<>(
			new SkyrimOutput("Imperial", "Mace of Molag Bal", "Frost Troll", "Solitude", "Whirlwind Sprint"), true));
		assertThat(solve(6, "2AB1C3", new ModuleEntity())).isEqualTo(new SolveSuccess<>(
			new SkyrimOutput("Dunmer", "Mace of Molag Bal", "Frost Troll", "Solitude", "Slow Time"), true));

		SkyrimInput duplicate = new SkyrimInput(List.of("Nord", "Nord", "Dunmer"), input.weapons(), input.enemies(), input.cities(), input.dragonShouts());
		assertThat(solver.solve(new RoundEntity(), bomb(2, "A1B2C3"), new ModuleEntity(), duplicate)).isInstanceOf(SolveFailure.class);
	}

	private Object solve(int batteries, String serial, ModuleEntity module) {
		return solver.solve(new RoundEntity(), bomb(batteries, serial), module, input);
	}

	private static BombEntity bomb(int batteries, String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		return bomb;
	}
}
