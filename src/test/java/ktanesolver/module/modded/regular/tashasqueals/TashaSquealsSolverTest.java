package ktanesolver.module.modded.regular.tashasqueals;

import static org.assertj.core.api.Assertions.assertThat;
import static ktanesolver.module.modded.regular.tashasqueals.TashaSquealsInput.Color.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TashaSquealsSolverTest {
    private final TashaSquealsSolver solver = new TashaSquealsSolver();

    @Test void appliesTheXorPriorityAndBuildsCumulativeSequences() {
        ModuleEntity module = new ModuleEntity();
        TashaSquealsOutput output = solve(module, 2,
            new TashaSquealsInput(PINK, GREEN, YELLOW, BLUE, List.of(PINK, GREEN, YELLOW, BLUE, PINK)));
        assertThat(output.pressColors()).containsExactly(PINK, BLUE, PINK, PINK, PINK);
        assertThat(output.stageSequences().get(4)).containsExactly(PINK, BLUE, PINK, PINK, PINK);
        assertThat(module.getState().get("tashaSquealsFlashes")).isEqualTo(List.of("Pink", "Green", "Yellow", "Blue", "Pink"));
    }

    @Test void reachesTheSecondAndThirdTables() {
        assertThat(solve(new ModuleEntity(), 2,
            new TashaSquealsInput(GREEN, YELLOW, BLUE, PINK, List.of(GREEN, YELLOW, BLUE, PINK, GREEN))).pressColors())
            .containsExactly(PINK, PINK, PINK, YELLOW, YELLOW);
    }

    @Test void rejectsIncompleteLayoutsAndFlashSequences() {
        assertThat(solver.solve(new RoundEntity(), bomb(2), new ModuleEntity(),
            new TashaSquealsInput(PINK, PINK, YELLOW, BLUE, List.of(PINK, GREEN, YELLOW, BLUE, PINK)))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), bomb(2), new ModuleEntity(),
            new TashaSquealsInput(PINK, GREEN, YELLOW, BLUE, List.of(PINK)))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private TashaSquealsOutput solve(ModuleEntity module, int batteries, TashaSquealsInput input) {
        return ((SolveSuccess<TashaSquealsOutput>) solver.solve(new RoundEntity(), bomb(batteries), module, input)).output();
    }

    private static BombEntity bomb(int batteries) {
        BombEntity bomb = new BombEntity();
        bomb.setAaBatteryCount(batteries);
        return bomb;
    }
}
