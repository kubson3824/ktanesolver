package ktanesolver.module.modded.regular.blindalley;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class BlindAlleySolverTest {
	@Test
	void selectsEveryRegionTiedForTheMostConditions() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A2BC34");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(2);
		bomb.setIndicators(Map.of("BOB", false, "CAR", true, "IND", true, "FRK", true, "NSA", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.RJ45, PortType.PARALLEL)));

		var result = (SolveSuccess<BlindAlleyOutput>) new BlindAlleySolver().solve(
			new RoundEntity(), bomb, new ModuleEntity(), new BlindAlleyInput());

		assertThat(result.output().regions()).containsExactly("TL", "TM");
		assertThat(result.output().conditionCounts()).containsEntry("TL", 3).containsEntry("TM", 3).containsEntry("BM", 2);
	}
}
