package ktanesolver.module.modded.regular.colorfulinsanity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ColorfulInsanitySolverTest {
    private final ColorfulInsanitySolver solver = new ColorfulInsanitySolver();

    @Test void findsBothPairsAndFiltersByAdjacentPatternAndAllowedColor() {
        List<ColorfulInsanityButton> buttons = buttons();
        buttons.set(4, new ColorfulInsanityButton(7, "PURPLE", "CYAN"));
        ColorfulInsanityOutput output = solve(buttons);
        assertThat(output.identicalPair()).containsExactly("A1", "B1");
        assertThat(output.reversedPair()).containsExactly("C1", "D1");
        assertThat(output.allowedPatternCells()).containsExactly(11, 13, 7, 17);
        assertThat(output.allowedColors()).containsExactly("PURPLE", "YELLOW");
        assertThat(output.pressCoordinates()).containsExactly("E1");
        assertThat(output.pairFallback()).isFalse();
    }

    @Test void pressesBothPairsWhenNoButtonMatches() {
        ColorfulInsanityOutput output = solve(buttons());
        assertThat(output.pressCoordinates()).containsExactly("A1", "B1", "C1", "D1");
        assertThat(output.pairFallback()).isTrue();
    }

    @Test void rejectsIncompleteAndAmbiguousGrids() {
        assertThat(result(List.of())).isInstanceOf(SolveFailure.class);
        List<ColorfulInsanityButton> buttons = buttons();
        buttons.set(4, buttons.getFirst());
        assertThat(result(buttons)).isInstanceOf(SolveFailure.class);
    }

    private static List<ColorfulInsanityButton> buttons() {
        List<ColorfulInsanityButton> buttons = new ArrayList<>();
        for (int index = 0; index < 35; index++) buttons.add(new ColorfulInsanityButton(
            index % 25, "CYAN", index < 25 ? "AZURE" : "BLUE"));
        buttons.set(0, new ColorfulInsanityButton(0, "RED", "ORANGE"));
        buttons.set(1, new ColorfulInsanityButton(0, "RED", "ORANGE"));
        buttons.set(2, new ColorfulInsanityButton(12, "YELLOW", "GREEN"));
        buttons.set(3, new ColorfulInsanityButton(12, "GREEN", "YELLOW"));
        return buttons;
    }

    @SuppressWarnings("unchecked")
    private ColorfulInsanityOutput solve(List<ColorfulInsanityButton> buttons) {
        return ((SolveSuccess<ColorfulInsanityOutput>) result(buttons)).output();
    }

    private Object result(List<ColorfulInsanityButton> buttons) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ColorfulInsanityInput(buttons));
    }
}
