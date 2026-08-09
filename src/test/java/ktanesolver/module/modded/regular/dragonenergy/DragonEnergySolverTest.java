package ktanesolver.module.modded.regular.dragonenergy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class DragonEnergySolverTest {
	private final DragonEnergySolver solver = new DragonEnergySolver();

	@Test
	void containsEverySubmitAvoidanceCell() {
		String[][][] bad = {
			{{"0159", "0346", "0278"}, {"01236", "02567", "1347"}, {"3479", "5689", "0129"}},
			{{"02468", "346", "0278"}, {"13579", "589", "1347"}, {"012345", "5689", "012"}},
			{{"012789", "0124578", "012345678"}, {"45678", "04679", "012345789"}, {"134679", "04567", "123456789"}}
		};
		for (int relation = 0; relation < 3; relation++) for (int color = 0; color < 3; color++) for (int strikes = 0; strikes < 3; strikes++) {
			String forbidden = bad[relation][color][strikes];
			String safe = DragonEnergySolver.safeDigits(relation, color, strikes).stream().map(String::valueOf).reduce("", String::concat);
			assertThat(safe.chars().filter(value -> forbidden.indexOf(value) < 0).count()).isEqualTo(safe.length());
			assertThat(safe.length() + forbidden.length()).isEqualTo(10);
		}
	}

	@Test
	void solvesVennSwapsAndRecordsIndicatorColor() {
		BombEntity bomb = bomb();
		ModuleEntity module = module(ModuleType.DRAGON_ENERGY, false);
		bomb.setModules(new ArrayList<>(List.of(module)));
		SolveSuccess<DragonEnergyOutput> result = solve(bomb, module,
			new DragonEnergyInput(List.of("Angry", "Blessing", "Child"), "cyan"));
		assertThat(result.output().acceptableWords()).isNotEmpty().allMatch(DragonEnergySolver.WORDS::contains);
		assertThat(result.output().safeTimerDigits()).isNotEmpty().allMatch(digit -> digit >= 0 && digit <= 9);
		assertThat(result.output().swapScenario()).isEqualTo(6);
		assertThat(module.getState()).containsEntry("indicatorColor", "Cyan");
	}

	@Test
	void selectsEverySwapScenarioAndValidatesInput() {
		BombEntity bomb = bomb(); bomb.setAaBatteryCount(11); bomb.setSerialNumber("BCD125"); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(1);
		bomb = bomb(); bomb.setPortPlates(List.of(new PortPlateEntity())); bomb.setModules(List.of(module(ModuleType.MORSE_WAR, false))); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(2);
		bomb = bomb(); bomb.setIndicators(new HashMap<>(Map.of("SIG", true, "FRK", true))); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(3);
		bomb = bomb(); for (int i = 0; i < 9; i++) bomb.getModules().add(module(ModuleType.WIRES, false)); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(4);
		bomb = bomb(); bomb.setSerialNumber("AEI123"); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(5);
		bomb = bomb(); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(6);
		bomb = bomb(); bomb.getModules().add(module(ModuleType.WIRES, true)); assertThat(DragonEnergySolver.scenario(bomb)).isEqualTo(7);
		assertThat(solver.solve(new RoundEntity(), bomb(), module(ModuleType.DRAGON_ENERGY, false),
			new DragonEnergyInput(List.of("Angry", "Angry", "Child"), "GREEN"))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<DragonEnergyOutput> solve(BombEntity bomb, ModuleEntity module, DragonEnergyInput input) { return (SolveSuccess<DragonEnergyOutput>) solver.solve(new RoundEntity(), bomb, module, input); }
	private static BombEntity bomb() { BombEntity bomb = new BombEntity(); bomb.setSerialNumber("BCD123"); return bomb; }
	private static ModuleEntity module(ModuleType type, boolean solved) { ModuleEntity module = new ModuleEntity(); module.setType(type); module.setSolved(solved); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
