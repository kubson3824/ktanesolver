package ktanesolver.module.modded.regular.bitwiseoperations;

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

class BitwiseOperationsSolverTest {
	private final BitwiseOperationsSolver solver = new BitwiseOperationsSolver();

	@Test
	void buildsBothBytesAndAppliesEveryOperator() {
		BombEntity bomb = bomb();
		assertThat(solve(bomb, "AND")).isEqualTo(new BitwiseOperationsOutput("11111101", "11111111", "11111101"));
		assertThat(solve(bomb, "OR").answer()).isEqualTo("11111111");

		BombEntity sparse = sparseBomb();
		assertThat(solve(sparse, "XOR")).isEqualTo(new BitwiseOperationsOutput("00000011", "00000001", "00000010"));
		assertThat(solve(sparse, "NOT").answer()).isEqualTo("11111100");
	}

	@Test
	void validatesInputAndPersistsTheDerivedBytes() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), bomb(), module, new BitwiseOperationsInput("shift", 5.0)))
			.isInstanceOf(SolveFailure.class);

		solver.solve(new RoundEntity(), bomb(), module, new BitwiseOperationsInput("and", 5.0));
		assertThat(module.getState()).containsEntry("operator", "AND").containsEntry("byte1", "11111101");
	}

	@SuppressWarnings("unchecked")
	private BitwiseOperationsOutput solve(BombEntity bomb, String operator) {
		return ((SolveSuccess<BitwiseOperationsOutput>) solver.solve(
			new RoundEntity(), bomb, module(), new BitwiseOperationsInput(operator, 5.0)
		)).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC125");
		bomb.setAaBatteryCount(0);
		bomb.setDBatteryCount(2);
		bomb.setIndicators(new HashMap<>(Map.of("NSA", true, "BOB", true, "CAR", true, "FRK", false, "SND", false)));
		bomb.replacePortPlates(List.of(Set.of(PortType.PARALLEL, PortType.SERIAL), Set.of(PortType.RJ45)));
		for (int i = 0; i < 6; i++) bomb.getModules().add(module());
		return bomb;
	}

	private static BombEntity sparseBomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC124");
		bomb.setAaBatteryCount(2);
		for (int i = 0; i < 5; i++) bomb.getModules().add(module());
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BITWISE_OPERATIONS);
		return module;
	}
}
