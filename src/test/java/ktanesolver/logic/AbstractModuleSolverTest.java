package ktanesolver.logic;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;

class AbstractModuleSolverTest {
    record TestInput(String color) implements ModuleInput {}
    record TestOutput() implements ModuleOutput {}

    @ModuleInfo(
        type = ModuleType.WIRES,
        id = "wires",
        name = "Wires",
        category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
        description = "Cut the right wire",
        tags = {}
    )
    static class AnnotatedSolver extends AbstractModuleSolver<TestInput, TestOutput> {
        @Override
        protected SolveResult<TestOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TestInput input) {
            return success(new TestOutput());
        }
    }

    static class UnannotatedSolver extends AbstractModuleSolver<ModuleInput, ModuleOutput> {
        @Override
        protected SolveResult<ModuleOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ModuleInput input) {
            return success(new ModuleOutput() {});
        }
    }

    @Test
    void getType_returnsModuleTypeFromAnnotation() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getType()).isEqualTo(ModuleType.WIRES);
    }

    @Test
    void getType_calledMultipleTimes_returnsSameInstance() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getType()).isSameAs(solver.getType());
    }

    @Test
    void getCatalogInfo_returnsCorrectName() {
        AnnotatedSolver solver = new AnnotatedSolver();
        assertThat(solver.getCatalogInfo().name()).isEqualTo("Wires");
    }

    @Test
    void successfulSolveRecordsTheLatestInputForSouvenirFallbacksWithoutPollutingState() {
        AnnotatedSolver solver = new AnnotatedSolver();
        ModuleEntity module = new ModuleEntity();

        solver.solve(new RoundEntity(), new BombEntity(), module, new TestInput("YELLOW"));
        solver.solve(new RoundEntity(), new BombEntity(), module, new TestInput("BLUE"));

        assertThat(module.getState()).isEmpty();
        assertThat(module.getSolution().get("input")).isEqualTo(Map.of("color", "BLUE"));
    }

    @Test
    void unannotatedSolver_throwsIllegalStateExceptionOnConstruction() {
        assertThatThrownBy(UnannotatedSolver::new)
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("ModuleSolver must be annotated with @ModuleInfo");
    }
}
