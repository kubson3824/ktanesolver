package ktanesolver.module.modded.regular.crypticpassword;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class CrypticPasswordSolverTest {
    private final CrypticPasswordSolver solver = new CrypticPasswordSolver();

    @Test void usesTheAuthoritativeDefaultRuleSeedTableAndReversesVowelInitialKeys() {
        CrypticPasswordOutput output = solve("ANSWER", "KEY");
        assertThat(output.answer()).isEqualTo("RDOTVU");
        assertThat(output.effectiveKey()).isEqualTo("YEK");
        assertThat(output.reversedKey()).isTrue();
        assertThat(output.transposedTable()).isFalse();
    }

    @Test void transposesTheTableWhenTheStartingWordEndsInAVowel() {
        CrypticPasswordOutput output = solve("MODULE", "ABCDEF");
        assertThat(output.answer()).isEqualTo("TJODQJ");
        assertThat(output.transposedTable()).isTrue();
    }

    @Test void validatesSourceGeneratedWordLengths() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new CrypticPasswordInput("SHORT", "KEY"))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new CrypticPasswordInput("ANSWER", "AB"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked") private CrypticPasswordOutput solve(String starting, String key) {
        return ((SolveSuccess<CrypticPasswordOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new CrypticPasswordInput(starting, key))).output();
    }
}
