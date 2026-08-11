package ktanesolver.module.modded.regular.sphere;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.sphere.SphereInput.Color;

class SphereSolverTest {
	private final SphereSolver solver = new SphereSolver();

	@Test void calculatesAllEightHoldColorsFromSourceFormulas() {
		BombEntity bomb = bomb(); int[] serial = {1,1,2,2,3,3};
		assertThat(List.of(Color.values()).stream().map(color -> SphereSolver.holdTime(color, bomb, serial)).toList()).containsExactly(5,2,3,10,9,3,9,8);
	}

	@Test void usesSpecialOrderAndFiltersPreviouslyCorrectRetryPositions() {
		BombEntity bomb = bomb(); ModuleEntity module = new ModuleEntity();
		List<Boolean> correct = List.of(true,false,true,false,true,false,true,false,true,false,true);
		SphereOutput output = ((SolveSuccess<SphereOutput>) solver.solve(new RoundEntity(), bomb, module, new SphereInput(List.of(Color.RED,Color.BLUE,Color.GREEN,Color.ORANGE,Color.PINK), correct))).output();
		assertThat(output.order()).isEqualTo(10);
		assertThat(output.fullSequence()).extracting(SphereOutput.Action::type).containsExactly("tap","hold","tap","hold","tap","hold","tap","hold","tap","hold","tap");
		assertThat(output.actions()).containsExactly(output.fullSequence().get(1), output.fullSequence().get(3), output.fullSequence().get(5), output.fullSequence().get(7), output.fullSequence().get(9));
		assertThat(module.getState().get("sphereColors")).isEqualTo(List.of("red","blue","green","orange","pink"));
	}

	@Test void coversNormalOrderAndValidation() {
		BombEntity bomb = bomb(); bomb.getIndicators().put("FRQ", true);
		assertThat(SphereSolver.order(bomb)).isZero();
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new SphereInput(List.of(Color.RED), null))).isInstanceOf(SolveFailure.class);
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("A1B2C3"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1); bomb.setIndicators(new java.util.HashMap<>(Map.of("SND", true, "FRQ", false)));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI,PortType.SERIAL), Set.of(PortType.PARALLEL,PortType.RJ45), Set.of(PortType.STEREO_RCA)));
		return bomb;
	}
}
