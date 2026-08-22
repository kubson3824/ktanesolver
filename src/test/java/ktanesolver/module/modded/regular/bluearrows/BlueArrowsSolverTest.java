package ktanesolver.module.modded.regular.bluearrows;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class BlueArrowsSolverTest {
    @Test void appliesTheBobExceptionAndStoresTheCoordinate() {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("ABC123");
        bomb.setIndicators(Map.of("BOB", true));
        ModuleEntity module = new ModuleEntity();
        @SuppressWarnings("unchecked")
        BlueArrowsOutput output = ((SolveSuccess<BlueArrowsOutput>) new BlueArrowsSolver().solve(
            new RoundEntity(), bomb, module, new BlueArrowsInput("ca"))).output();
        assertThat(output.directions()).containsExactly("left", "up", "right", "down");
        assertThat(output.command()).isEqualTo("left up right down");
        assertThat(module.getState()).containsEntry("blueArrowsInitialCharacters", "CA");
    }
}
