package ktanesolver.module.modded.regular.tenbuttoncolorcode;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TenButtonColorCodeSolverTest {
    private final TenButtonColorCodeSolver solver = new TenButtonColorCodeSolver();

    @Test void solvesBothRuleDirectionsAndStoresBothInitialStagesForSouvenir() {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("ABC123");
        ModuleEntity module = new ModuleEntity();
        List<String> first = List.of("RED", "GREEN", "BLUE", "RED", "GREEN", "BLUE", "RED", "GREEN", "BLUE", "RED");
        List<String> second = List.of("BLUE", "BLUE", "GREEN", "GREEN", "RED", "RED", "GREEN", "BLUE", "RED", "GREEN");

        var stageOne = solve(bomb, module, 1, first);
        assertThat(stageOne.solved()).isFalse();
        assertThat(stageOne.output().targetColors()).containsExactly("GREEN", "BLUE", "RED", "BLUE", "RED", "RED", "RED", "BLUE", "RED", "GREEN");
        assertThat(stageOne.output().presses()).containsExactly(1, 2, 3, 4, 4, 5, 5, 6, 8, 9, 10);

        var stageTwo = solve(bomb, module, 2, second);
        assertThat(stageTwo.solved()).isTrue();
        assertThat(stageTwo.output().targetColors()).containsExactly("RED", "GREEN", "BLUE", "RED", "BLUE", "RED", "RED", "BLUE", "GREEN", "RED");
        assertThat(stageTwo.output().presses()).containsExactly(1, 2, 2, 3, 4, 4, 5, 5, 7, 7, 9, 10, 10);
        assertThat(module.getState().get("tenButtonColorCodeInitialColors")).isEqualTo(List.of(
            first.stream().map(String::toLowerCase).toList(), second.stream().map(String::toLowerCase).toList()));
    }

    @Test void rejectsInvalidColorsAndStageTwoWithoutStageOne() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123");
        assertThat(result(bomb, new ModuleEntity(), 2, java.util.Collections.nCopies(10, "RED"))).isInstanceOf(SolveFailure.class);
        assertThat(result(bomb, new ModuleEntity(), 1, java.util.Collections.nCopies(9, "RED"))).isInstanceOf(SolveFailure.class);
        assertThat(result(bomb, new ModuleEntity(), 1, List.of("RED", "GREEN", "BLUE", "RED", "GREEN", "BLUE", "RED", "GREEN", "BLUE", "PURPLE"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private SolveSuccess<TenButtonColorCodeOutput> solve(BombEntity bomb, ModuleEntity module, int stage, List<String> colors) {
        return (SolveSuccess<TenButtonColorCodeOutput>) result(bomb, module, stage, colors);
    }
    private Object result(BombEntity bomb, ModuleEntity module, int stage, List<String> colors) {
        return solver.solve(new RoundEntity(), bomb, module, new TenButtonColorCodeInput(stage, colors));
    }
}
