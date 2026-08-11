package ktanesolver.module.modded.regular.sueetwall;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SueetWallSolverTest {
    private final SueetWallSolver solver = new SueetWallSolver();

    @Test void appliesAllEightSuitAndTextColorConditions() {
        assertCondition("CLUBS","BLACK",10,50,"HEARTS","BLACK",11);
        assertCondition("CLUBS","RED",10,50,"HEARTS","BLACK",9);
        assertCondition("HEARTS","BLACK",10,50,"CLUBS","BLACK",49);
        assertCondition("HEARTS","RED",10,50,"CLUBS","BLACK",51);
        assertCondition("SPADES","BLACK",10,50,"SPADES","RED",1);
        assertCondition("SPADES","RED",10,50,"HEARTS","BLACK",1);
        assertCondition("DIAMONDS","BLACK",10,50,"HEARTS","RED",1);
        assertCondition("DIAMONDS","RED",10,50,"CLUBS","RED",1);
    }

    @Test void wrapsAtEveryGridEdge() {
        List<SueetWallButton> grid = fill(new SueetWallButton("CLUBS", 20, "BLACK"));
        grid.set(0, new SueetWallButton("CLUBS", 10, "BLACK"));
        for (int index : List.of(19,17,7,5)) grid.set(index, new SueetWallButton("HEARTS", 11, "RED"));
        assertThat(SueetWallSolver.correct(grid, 50, 0)).isTrue();
    }

    @Test void returnsA1WhenNoButtonQualifies() {
        var output = solve(30, fill(new SueetWallButton("CLUBS", 1, "BLACK")));
        assertThat(output.anyButtonAllowed()).isTrue();
        assertThat(output.pressCoordinates()).containsExactly("A1");
    }

    @Test void validatesGeneratedInputShape() {
        assertThat(result(30, List.of())).isInstanceOf(SolveFailure.class);
        List<SueetWallButton> invalid = fill(new SueetWallButton("JOKER", 1, "BLACK"));
        assertThat(result(30, invalid)).isInstanceOf(SolveFailure.class);
        invalid = fill(new SueetWallButton("CLUBS", 101, "BLACK"));
        assertThat(result(30, invalid)).isInstanceOf(SolveFailure.class);
    }

    private void assertCondition(String suit, String color, int number, int minutes, String neighborSuit, String neighborColor, int neighborNumber) {
        List<SueetWallButton> grid = fill(new SueetWallButton(neighborSuit, neighborNumber, neighborColor));
        grid.set(9, new SueetWallButton(suit, number, color));
        assertThat(SueetWallSolver.correct(grid, minutes, 9)).as(suit + " " + color).isTrue();
    }
    private SueetWallOutput solve(int minutes, List<SueetWallButton> buttons) { return ((SolveSuccess<SueetWallOutput>) result(minutes, buttons)).output(); }
    private Object result(int minutes, List<SueetWallButton> buttons) { return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new SueetWallInput(minutes, buttons)); }
    private static List<SueetWallButton> fill(SueetWallButton value) { return new ArrayList<>(java.util.Collections.nCopies(20, value)); }
}
