package ktanesolver.module.modded.regular.simpleton;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class SimpletonSolverTest {
    @Test
    void alwaysTellsTheDefuserToPushTheButton() {
        var result = (SolveSuccess<SimpletonOutput>) new SimpletonSolver().solve(
            new RoundEntity(), new BombEntity(), new ModuleEntity(), new SimpletonInput());

        assertThat(result.output()).isEqualTo(new SimpletonOutput("PUSH"));
    }
}
