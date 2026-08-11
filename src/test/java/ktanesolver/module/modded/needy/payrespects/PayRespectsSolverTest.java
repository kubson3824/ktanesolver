package ktanesolver.module.modded.needy.payrespects;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PayRespectsSolverTest {
    private final PayRespectsSolver solver = new PayRespectsSolver();

    @Test void directsRepeatedPressesWhileActiveWithoutSolvingNeedy() {
        var result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new PayRespectsInput(true));
        assertThat(result).isInstanceOf(SolveSuccess.class);
        var success = (SolveSuccess<PayRespectsOutput>) result;
        assertThat(success.solved()).isFalse();
        assertThat(success.output().action()).contains("Press F").contains("30 seconds");
    }

    @Test void refusesInteractionWhileInactive() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new PayRespectsInput(false)))
            .isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), null))
            .isInstanceOf(SolveFailure.class);
    }
}
