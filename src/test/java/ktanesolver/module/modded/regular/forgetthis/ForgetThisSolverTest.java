package ktanesolver.module.modded.regular.forgetthis;

import static org.assertj.core.api.Assertions.assertThat;
import static ktanesolver.module.modded.regular.forgetthis.ForgetThisInput.LedColor.*;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.forgetthis.ForgetThisInput.Stage;

class ForgetThisSolverTest {
    private final ForgetThisSolver solver = new ForgetThisSolver();

    @Test void appliesAllFiveOperationsWrapsAndPersistsHistory() {
        ModuleEntity module = new ModuleEntity();
        ForgetThisOutput output = solve(module, List.of(
            stage("A", CYAN), stage("5", CYAN), stage("9", MAGENTA),
            stage("4", YELLOW), stage("7", BLACK), stage("2", WHITE)), List.of(2,3,4,5,6));
        assertThat(output.answer()).isEqualTo("F");
        assertThat(output.steps()).extracting(ForgetThisOutput.Step::after).containsExactly(15,19,27,17,15);
        assertThat(module.getState().get("forgetThisDigits")).isEqualTo(List.of("A","5","9","4","7","2"));
        assertThat(module.getState().get("forgetThisColors")).isEqualTo(List.of("Cyan","Cyan","Magenta","Yellow","Black","White"));
    }

    @Test void skipsEveryColorWhenItsBlockingPredecessorIsPresent() {
        assertThat(solve(new ModuleEntity(), List.of(
            stage("K", YELLOW), stage("1", CYAN), stage("2", BLACK),
            stage("3", MAGENTA), stage("4", WHITE), stage("5", YELLOW)), List.of(2,3,4,5,6)).decimalAnswer()).isEqualTo(20);
    }

    @Test void rejectsInvalidDigitsAndStageReferences() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new ForgetThisInput(List.of(stage("?", CYAN), stage("1", BLACK)), List.of(2,2,2,2,2)))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new ForgetThisInput(List.of(stage("0", CYAN), stage("1", BLACK)), List.of(2,3,2,2,2)))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private ForgetThisOutput solve(ModuleEntity module, List<Stage> stages, List<Integer> references) {
        return ((SolveSuccess<ForgetThisOutput>) solver.solve(new RoundEntity(), new BombEntity(), module,
            new ForgetThisInput(stages, references))).output();
    }

    private static Stage stage(String digit, ForgetThisInput.LedColor color) { return new Stage(digit, color); }
}
