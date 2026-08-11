package ktanesolver.module.modded.regular.thetriangle;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheTriangleSolverTest {
    private final TheTriangleSolver solver = new TheTriangleSolver();
    private static final String[] ART = {"Picasso", "Cool", "Concentric"};
    private static final String[] LETTERS = {"T", "R", "N", "G"};
    private static final String[][][] EXPECTED = {
        {{"GREEN","RED","BLUE","YELLOW"},{"RED","YELLOW","BLUE","GREEN"},{"BLUE","GREEN","RED","YELLOW"}},
        {{"YELLOW","BLUE","GREEN","RED"},{"GREEN","RED","YELLOW","BLUE"},{"RED","BLUE","YELLOW","GREEN"}}
    };

    @Test void coversAllTwentyFourManualCells() {
        for (int direction = 0; direction < 2; direction++) for (int art = 0; art < 3; art++) for (int letter = 0; letter < 4; letter++) {
            ModuleEntity module = new ModuleEntity();
            TheTriangleOutput output = solve(module, direction == 0 ? "CW" : "CCW", ART[art], LETTERS[letter], List.of("BLUE","GREEN","RED","YELLOW"));
            assertThat(output.color()).as("%s %s %s", direction, ART[art], LETTERS[letter]).isEqualTo(EXPECTED[direction][art][letter]);
            assertThat(output.position()).isEqualTo(List.of("MID","TL","BL","BR").get(List.of("BLUE","GREEN","RED","YELLOW").indexOf(output.color())));
        }
    }

    @Test void repeatedPhysicalTriangleDoesNotAdvanceAndFourDistinctPositionsSolve() {
        ModuleEntity module = new ModuleEntity();
        assertThat(result(module,"CW","Picasso","N",List.of("BLUE","GREEN","RED","YELLOW"))).isInstanceOf(SolveSuccess.class)
            .extracting(r -> ((SolveSuccess<?>) r).solved()).isEqualTo(false); // MID
        solve(module,"CW","Cool","N",List.of("BLUE","GREEN","RED","YELLOW")); // MID again
        solve(module,"CW","Picasso","T",List.of("BLUE","GREEN","RED","YELLOW")); // TL
        solve(module,"CW","Picasso","R",List.of("BLUE","GREEN","RED","YELLOW")); // BL
        var finalResult = result(module,"CW","Picasso","G",List.of("BLUE","GREEN","RED","YELLOW")); // BR
        assertThat(((SolveSuccess<?>) finalResult).solved()).isTrue();
        assertThat(module.getState().get("triangleCompletedPositions")).isEqualTo(List.of("MID","TL","BL","BR"));
    }

    @Test void validatesPermutationAndRuleInputs() {
        ModuleEntity module = new ModuleEntity();
        assertThat(result(module,"SIDEWAYS","Picasso","T",List.of("BLUE","GREEN","RED","YELLOW"))).isInstanceOf(SolveFailure.class);
        assertThat(result(module,"CW","Picasso","X",List.of("BLUE","GREEN","RED","YELLOW"))).isInstanceOf(SolveFailure.class);
        assertThat(result(module,"CW","Picasso","T",List.of("BLUE","BLUE","RED","YELLOW"))).isInstanceOf(SolveFailure.class);
    }

    private TheTriangleOutput solve(ModuleEntity module, String rotation, String artwork, String letter, List<String> colors) {
        return ((SolveSuccess<TheTriangleOutput>) result(module, rotation, artwork, letter, colors)).output();
    }
    private Object result(ModuleEntity module, String rotation, String artwork, String letter, List<String> colors) {
        return solver.solve(new RoundEntity(), new BombEntity(), module, new TheTriangleInput(rotation, artwork, letter, colors));
    }
}
