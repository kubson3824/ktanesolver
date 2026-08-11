package ktanesolver.module.modded.regular.crackbox;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class CrackboxSolverTest {
    private final CrackboxSolver solver = new CrackboxSolver();
    private static final List<String> PUZZLE = List.of(
        "1", "EMPTY", "BLACK", "EMPTY", "BLACK", "EMPTY", "EMPTY", "BLACK",
        "EMPTY", "BLACK", "EMPTY", "EMPTY", "BLACK", "8", "EMPTY", "BLACK");

    @Test void completesTheGridAndProducesAcceptedTwitchTokens() {
        var result = solve(PUZZLE, 1);
        List<Integer> numbers = result.solution().stream().filter(value -> !value.equals("BLACK")).map(Integer::parseInt).toList();
        assertThat(numbers).hasSize(10);
        assertThat(new HashSet<>(numbers)).containsExactlyInAnyOrderElementsOf(java.util.stream.IntStream.rangeClosed(1, 10).boxed().toList());
        assertThat(result.solution().get(0)).isEqualTo("1");
        assertThat(result.solution().get(13)).isEqualTo("8");
        assertThat(result.twitchTokens()).allMatch(token -> token.matches("[dr]|10|[1-9]"));
        assertThat(result.twitchTokens().stream().filter(token -> token.matches("10|[1-9]")).toList()).hasSize(8);
    }

    @Test void rejectsMalformedOrImpossibleGrids() {
        assertThat(raw(java.util.Collections.nCopies(16, "EMPTY"), 1)).isInstanceOf(SolveFailure.class);
        List<String> duplicate = new java.util.ArrayList<>(PUZZLE); duplicate.set(13, "1");
        assertThat(raw(duplicate, 1)).isInstanceOf(SolveFailure.class);
        assertThat(raw(PUZZLE, 3)).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private CrackboxOutput solve(List<String> cells, int selected) { return ((SolveSuccess<CrackboxOutput>) raw(cells, selected)).output(); }
    private Object raw(List<String> cells, int selected) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new CrackboxInput(cells, selected));
    }
}
