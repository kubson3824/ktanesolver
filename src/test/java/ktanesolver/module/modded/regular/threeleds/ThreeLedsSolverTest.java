package ktanesolver.module.modded.regular.threeleds;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class ThreeLedsSolverTest {
    private final ThreeLedsSolver solver = new ThreeLedsSolver();

    @Test void appliesTheColorTableInTopBottomLeftBottomRightOrderAndStoresSouvenirState() {
        ModuleEntity module = new ModuleEntity();
        ThreeLedsOutput output = solve("ABC123", module,
            List.of("WHITE", "RED", "GREEN"), List.of(true, false, true));
        assertThat(output.targetStates()).containsExactly(false, true, false);
        assertThat(output.togglePositions()).containsExactly(1, 2, 3);
        assertThat(module.getState().get("threeLedsInitialState")).isEqualTo("101");
    }

    @Test void usesEverySerialDigitOnlyForTheTwoMissingTableStates() {
        assertThat(solve("ABC123", new ModuleEntity(), List.of("WHITE", "WHITE", "WHITE"), List.of(false, false, false)).targetStates())
            .containsExactly(true, true, true);
        assertThat(solve("ABC123", new ModuleEntity(), List.of("RED", "BLUE", "GREEN"), List.of(true, true, false)).targetStates())
            .containsExactly(false, false, true);
    }

    @Test void rejectsMissingColorsAndStates() {
        assertThat(result("ABC123", new ModuleEntity(), List.of("WHITE", "RED"), List.of(true, false, true)))
            .isInstanceOf(SolveFailure.class);
        assertThat(result("ABC123", new ModuleEntity(), List.of("WHITE", "PURPLE", "RED"), List.of(true, false, true)))
            .isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private ThreeLedsOutput solve(String serial, ModuleEntity module, List<String> colors, List<Boolean> states) {
        return ((SolveSuccess<ThreeLedsOutput>) result(serial, module, colors, states)).output();
    }

    private SolveResult<ThreeLedsOutput> result(String serial, ModuleEntity module, List<String> colors, List<Boolean> states) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serial);
        return solver.solve(new RoundEntity(), bomb, module, new ThreeLedsInput(colors, states));
    }
}
