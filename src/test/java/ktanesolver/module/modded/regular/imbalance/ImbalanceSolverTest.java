package ktanesolver.module.modded.regular.imbalance;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class ImbalanceSolverTest {
    private final ImbalanceSolver solver = new ImbalanceSolver();

    @Test void decodesSourceGeneratedBarsAndMultipliesThem() {
        ImbalanceOutput output = solve("LEFT", "221", "RIGHT", "1122");
        assertThat(output).isEqualTo(new ImbalanceOutput(5, 10, 50));
    }

    @Test void handlesBothEmptyBarValuesAndTheGeneratedUpperBound() {
        assertThat(solve("LEFT", "", "RIGHT", "")).isEqualTo(new ImbalanceOutput(0, 1, 0));
        assertThat(solve("LEFT", "2121211", "LEFT", "2121211").answer()).isEqualTo(16129);
    }

    @Test void rejectsInvalidOrOutOfRangeDisplays() {
        assertThat(result("UP", "12", "LEFT", "12")).isInstanceOf(SolveFailure.class);
        assertThat(result("LEFT", "123", "LEFT", "12")).isInstanceOf(SolveFailure.class);
        assertThat(result("LEFT", "2121212", "LEFT", "12")).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private ImbalanceOutput solve(String topMarker, String topDigits, String bottomMarker, String bottomDigits) {
        return ((SolveSuccess<ImbalanceOutput>) result(topMarker, topDigits, bottomMarker, bottomDigits)).output();
    }

    private SolveResult<ImbalanceOutput> result(String topMarker, String topDigits, String bottomMarker, String bottomDigits) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new ImbalanceInput(topMarker, topDigits, bottomMarker, bottomDigits));
    }
}
