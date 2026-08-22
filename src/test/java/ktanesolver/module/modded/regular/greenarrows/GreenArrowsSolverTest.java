package ktanesolver.module.modded.regular.greenarrows;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class GreenArrowsSolverTest {
    @Test void mapsTheSeedOneTableTracksSevenAndStoresTheLastDisplay() {
        GreenArrowsSolver solver = new GreenArrowsSolver(); ModuleEntity module = new ModuleEntity();
        for (int i = 0; i < 7; i++) {
            @SuppressWarnings("unchecked") GreenArrowsOutput output = ((SolveSuccess<GreenArrowsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new GreenArrowsInput(i, false))).output();
            assertThat(output.direction()).isEqualTo(new String[]{"down","left","up","right","down","up","right"}[i]);
            assertThat(output.streakAfterPress()).isEqualTo(i + 1);
        }
        assertThat(module.getState()).containsEntry("greenArrowsLastNumber", "06");
    }

    @Test void resetsTheStreakAfterAStrike() {
        ModuleEntity module = new ModuleEntity(); module.getState().put("greenArrowsStreak", 5);
        @SuppressWarnings("unchecked") GreenArrowsOutput output = ((SolveSuccess<GreenArrowsOutput>) new GreenArrowsSolver().solve(new RoundEntity(), new BombEntity(), module, new GreenArrowsInput(99, true))).output();
        assertThat(output.streakAfterPress()).isEqualTo(1); assertThat(output.direction()).isEqualTo("left");
    }
}
