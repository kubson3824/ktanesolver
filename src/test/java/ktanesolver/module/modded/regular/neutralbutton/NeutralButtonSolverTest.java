package ktanesolver.module.modded.regular.neutralbutton;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class NeutralButtonSolverTest {
    @Test
    void reportsTheFullAcceptanceWindow() {
        var result = (SolveSuccess<NeutralButtonOutput>) new NeutralButtonSolver().solve(
            new RoundEntity(), new BombEntity(), new ModuleEntity(), new NeutralButtonInput());

        assertThat(result.output()).isEqualTo(new NeutralButtonOutput("BLINK", 500));
    }
}
