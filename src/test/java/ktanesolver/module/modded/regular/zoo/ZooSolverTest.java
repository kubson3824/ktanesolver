package ktanesolver.module.modded.regular.zoo;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class ZooSolverTest {
	@Test
	void usesTheHighestUniqueEligiblePortCountAndFallsBackWhenAllAreTied() {
		var bomb = new BombEntity();
		bomb.replacePortPlates(List.of(Set.of(PortType.SERIAL)));
		var solver = new ZooSolver();

		var portResult = solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new ZooInput("Plesiosaur", "Sheep"));
		assertThat(portResult).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<ZooOutput>) portResult).output().animals())
			.containsExactly("Cow", "Tyrannosaurus Rex", "Rabbit", "Horse", "Flamingo");

		bomb.replacePortPlates(List.of());
		var fallbackResult = solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new ZooInput("Sheep", "Plesiosaur"));
		assertThat(fallbackResult).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<ZooOutput>) fallbackResult).output().animals())
			.containsExactly("Cow", "Rhinoceros", "Dolphin", "Triceratops", "Salamander");
	}
}
