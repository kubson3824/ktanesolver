package ktanesolver.module.modded.regular.turnthekeys;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class TurnTheKeysSolverTest {

	@Test
	void marksSolvedOnlyAfterBothKeysAreTurned() {
		TurnTheKeysSolver solver = new TurnTheKeysSolver();
		BombEntity bomb = new BombEntity();
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(ModuleType.TURN_THE_KEYS);
		module.setBomb(bomb);
		bomb.getModules().add(module);

		solver.solve(new RoundEntity(), bomb, module, new TurnTheKeysInput(1));
		assertThat(module.isSolved()).isFalse();

		solver.solve(new RoundEntity(), bomb, module, new TurnTheKeysInput(1, true, null));
		assertThat(module.isSolved()).isFalse();

		solver.solve(new RoundEntity(), bomb, module, new TurnTheKeysInput(1, null, true));
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void listsTheModulesThatMustBeHandledFirst() {
		TurnTheKeysSolver solver = new TurnTheKeysSolver();
		BombEntity bomb = new BombEntity();
		ModuleEntity current = module(bomb, ModuleType.TURN_THE_KEYS);
		ModuleEntity higherPriority = module(bomb, ModuleType.TURN_THE_KEYS);
		higherPriority.getState().put("priority", 3);
		ModuleEntity unknownPriority = module(bomb, ModuleType.TURN_THE_KEYS);
		ModuleEntity wires = module(bomb, ModuleType.WIRES);
		ModuleEntity password = module(bomb, ModuleType.PASSWORDS);

		@SuppressWarnings("unchecked")
		TurnTheKeysOutput output = ((SolveSuccess<TurnTheKeysOutput>) solver.solve(
			new RoundEntity(), bomb, current, new TurnTheKeysInput(1))).output();

		assertThat(output.rightKeyRequirements())
			.extracting(TurnTheKeysOutput.Requirement::moduleId)
			.containsExactly(unknownPriority.getId(), higherPriority.getId(), wires.getId());
		assertThat(output.leftKeyRequirements())
			.extracting(TurnTheKeysOutput.Requirement::moduleId)
			.containsExactly(unknownPriority.getId(), higherPriority.getId(), current.getId(), password.getId());
	}

	private static ModuleEntity module(BombEntity bomb, ModuleType type) {
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(type);
		module.setBomb(bomb);
		bomb.getModules().add(module);
		return module;
	}
}
