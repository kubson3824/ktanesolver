package ktanesolver.module.modded.regular.sillyslots;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.sillyslots.Slot.Color;
import ktanesolver.module.modded.regular.sillyslots.Slot.Shape;

class SillySlotsSolverTest {
	private final SillySlotsSolver solver = new SillySlotsSolver();

	@Test
	void usesRawReelsAndTheCurrentKeywordForHistoricalExceptions() {
		ModuleEntity module = module();

		SillySlotsOutput first = solve(module, Keyword.SASSY, List.of(
			new Slot(Color.RED, Shape.BOMB),
			new Slot(Color.BLUE, Shape.GRAPE),
			new Slot(Color.GREEN, Shape.COIN)
		));
		assertThat(first).isEqualTo(new SillySlotsOutput(false, 1));
		assertThat(module.isSolved()).isFalse();
		assertThat(module.getState().get("displayHistory")).isEqualTo(List.of(List.of(
			"red bomb", "blue grape", "green coin"
		)));

		SillySlotsOutput second = solve(module, Keyword.SILLY, List.of(
			new Slot(Color.GREEN, Shape.BOMB),
			new Slot(Color.BLUE, Shape.CHERRY),
			new Slot(Color.RED, Shape.BOMB)
		));
		assertThat(second).isEqualTo(new SillySlotsOutput(true));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("displayHistory")).as("the visible KEEP stage is not a Souvenir question").isEqualTo(List.of(List.of(
			"red bomb", "blue grape", "green coin"
		)));
	}

	@Test
	void fourthIllegalPullAutomaticallySolves() {
		ModuleEntity module = module();
		List<Slot> slots = List.of(
			new Slot(Color.RED, Shape.BOMB),
			new Slot(Color.BLUE, Shape.GRAPE),
			new Slot(Color.GREEN, Shape.COIN)
		);

		for (int pull = 1; pull <= 4; pull++) {
			assertThat(solve(module, Keyword.SASSY, slots).illegalRuleNumber()).isEqualTo(1);
			assertThat(module.isSolved()).isEqualTo(pull == 4);
		}
		assertThat(((List<?>) module.getState().get("displayHistory"))).hasSize(4);
	}

	@SuppressWarnings("unchecked")
	private SillySlotsOutput solve(ModuleEntity module, Keyword keyword, List<Slot> slots) {
		return ((SolveSuccess<SillySlotsOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new SillySlotsInput(keyword, slots)
		)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SILLY_SLOTS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
