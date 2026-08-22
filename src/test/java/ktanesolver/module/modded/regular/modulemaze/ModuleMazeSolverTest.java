package ktanesolver.module.modded.regular.modulemaze;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ModuleMazeSolverTest {
    private final ModuleMazeSolver solver = new ModuleMazeSolver();

    @Test void followsTheAuthoritativeMazeAndPersistsTheStartingIcon() {
        ModuleEntity module = new ModuleEntity();
        ModuleMazeOutput output = solve(module, "Wire Sequence", "Hidden Colors");
        assertThat(output.route()).isEqualTo("RDLDDRRDDDDRDRDRRDRDDDDDRDRURRDRRRURRDRRDDRD");
        assertThat(output.moveCount()).isEqualTo(44);
        assertThat(module.getState().get("moduleMazeStartingIcon")).isEqualTo("Wire Sequence");
    }

    @Test void acceptsCaseAndStraightApostropheVariants() {
        assertThat(solve(new ModuleEntity(), "who's on first", "Two Bits").startingIcon()).isEqualTo("Who’s on First");
    }

    @Test void exposesAllFourHundredIconsInPrefabOrder() {
        assertThat(ModuleMazeSolver.ICONS).hasSize(400);
        assertThat(ModuleMazeSolver.ICONS.get(348)).isEqualTo("Pigpen Rotations");
        assertThat(ModuleMazeSolver.ICONS.get(399)).isEqualTo("Hidden Colors");
    }

    @Test void rejectsUnknownAndMatchingIcons() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ModuleMazeInput("Nope", "Wires"))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ModuleMazeInput("Wires", "Wires"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private ModuleMazeOutput solve(ModuleEntity module, String start, String destination) {
        return ((SolveSuccess<ModuleMazeOutput>) solver.solve(
            new RoundEntity(), new BombEntity(), module, new ModuleMazeInput(start, destination))).output();
    }
}
