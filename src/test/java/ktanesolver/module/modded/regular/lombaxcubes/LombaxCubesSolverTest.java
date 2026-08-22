package ktanesolver.module.modded.regular.lombaxcubes;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LombaxCubesSolverTest {
    private final LombaxCubesSolver solver = new LombaxCubesSolver();
    @Test void calculatesCubeSelectionAndTimerDigit() {
        ModuleEntity module = new ModuleEntity();
        var result = (SolveSuccess<LombaxCubesOutput>) solver.solve(new RoundEntity(), new BombEntity(), module,
            new LombaxCubesInput("AG", "White", List.of("AAAAAA", "BBBBBB", "CCCCCC", "DDDDDD", "EEEEEE", "FFFFFF")));
        assertThat(result.output().cubeX()).isEqualTo("Blue");
        assertThat(result.output().cubeY()).isEqualTo("Red");
        assertThat(result.output().timerDigit()).isEqualTo(1);
        assertThat(module.getState().get("lombaxCubesButtonLetters")).isEqualTo(List.of("A", "G"));
    }
    @Test void validatesGlyphCounts() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new LombaxCubesInput("A", "Red", List.of()))).isInstanceOf(SolveFailure.class);
    }
}
