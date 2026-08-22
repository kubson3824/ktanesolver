package ktanesolver.module.modded.regular.simonscrambles;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SimonScramblesSolverTest {
    private final SimonScramblesSolver solver = new SimonScramblesSolver();

    @Test void appliesEveryManualRowAndPersistsTheSouvenirSequence() {
        ModuleEntity module = new ModuleEntity();
        List<String> flashes = List.of("BLUE", "YELLOW", "RED", "GREEN", "BLUE", "YELLOW", "RED", "GREEN", "BLUE", "YELLOW");
        assertThat(solve(module, flashes).presses()).containsExactly(
            "YELLOW", "BLUE", "YELLOW", "BLUE", "RED", "YELLOW", "BLUE", "RED", "RED", "RED");
        assertThat(module.getState().get("simonScramblesSequence")).isEqualTo(List.of(
            "Blue", "Yellow", "Red", "Green", "Blue", "Yellow", "Red", "Green", "Blue", "Yellow"));
    }

    @Test void rejectsInvalidOrIncompleteSequences() {
        assertThat(result(new ModuleEntity(), List.of("RED"))).isInstanceOf(SolveFailure.class);
        assertThat(result(new ModuleEntity(), java.util.Collections.nCopies(10, "ORANGE"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private SimonScramblesOutput solve(ModuleEntity module, List<String> flashes) {
        return ((SolveSuccess<SimonScramblesOutput>) result(module, flashes)).output();
    }

    private Object result(ModuleEntity module, List<String> flashes) {
        return solver.solve(new RoundEntity(), new BombEntity(), module, new SimonScramblesInput(flashes));
    }
}
