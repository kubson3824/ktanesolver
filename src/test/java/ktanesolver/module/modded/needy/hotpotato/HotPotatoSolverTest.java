package ktanesolver.module.modded.needy.hotpotato;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class HotPotatoSolverTest {
    private final HotPotatoSolver solver = new HotPotatoSolver();

    @Test void dropsHeldBombAndLeavesDroppedBombAlone() {
        assertThat(solve(true).action()).isEqualTo("DROP_BOMB");
        assertThat(solve(false).action()).isEqualTo("KEEP_BOMB_DROPPED");
        assertThat(result(true, true)).isInstanceOf(SolveSuccess.class).extracting(r -> ((SolveSuccess<?>) r).solved()).isEqualTo(false);
    }
    @Test void refusesInactiveOrIncompleteState() {
        assertThat(result(false, true)).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), null)).isInstanceOf(SolveFailure.class);
    }
    private HotPotatoOutput solve(boolean held) { return ((SolveSuccess<HotPotatoOutput>) result(true, held)).output(); }
    private Object result(boolean active, boolean held) { return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new HotPotatoInput(active, held)); }
}
