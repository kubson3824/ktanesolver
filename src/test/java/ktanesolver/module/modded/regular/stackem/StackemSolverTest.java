package ktanesolver.module.modded.regular.stackem;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class StackemSolverTest {
    private final StackemSolver solver = new StackemSolver();

    @Test void derivesStableRanksAndBuildsEveryStackWithinFiveCubes() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("AB1CD2");
        @SuppressWarnings("unchecked")
        StackemOutput output = ((SolveSuccess<StackemOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new StackemInput(List.of(1, 6, 25, 30)))).output();
        assertThat(output.cubeValues()).containsOnlyKeys("Blue", "Green", "Orange", "Magenta", "Red", "Yellow");
        assertThat(output.cubeValues().values()).containsExactlyInAnyOrder(1, 2, 3, 4, 5, 6);
        assertThat(output.stacks()).allSatisfy(stack -> assertThat(stack).hasSizeLessThanOrEqualTo(5));
        for (int i = 0; i < 4; i++) assertThat(output.stacks().get(i).stream().mapToInt(output.cubeValues()::get).sum()).isEqualTo(List.of(1, 6, 25, 30).get(i));
    }

    @Test void validatesTargets() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123");
        assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new StackemInput(List.of(0, 1, 2, 3)))).isInstanceOf(SolveFailure.class);
    }
}
