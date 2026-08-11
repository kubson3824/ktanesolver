package ktanesolver.module.modded.regular.hieroglyphics;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class HieroglyphicsSolverTest {
    private final HieroglyphicsSolver solver = new HieroglyphicsSolver();

    @Test void solvesValuesLocksPriorityCountAndDigitalRoot() {
        HieroglyphicsOutput output = solve(input(List.of("Male","Bull","Urn","Eye of Horus","Ankh"), "BC", "DE"));
        assertThat(output.values()).containsEntry("A",1).containsEntry("B",2).containsEntry("C",3).containsEntry("D",4).containsEntry("E",5);
        assertThat(output.anubisPosition()).isEqualTo("LEFT");
        assertThat(output.horusPosition()).isEqualTo("CENTER");
        assertThat(output.priorityGlyph()).isEqualTo("MALE");
        assertThat(output.priorityOccurrences()).isEqualTo(4);
        assertThat(output.timerDigit()).isEqualTo(4);
    }

    @Test void skipsNonPriorityGlyphsAndCountsRowsAndLocks() {
        HieroglyphicsOutput output = solve(input(List.of("Triangle","Bull","Horn","Owl","Ankh"), "BC", "BE"));
        assertThat(output.priorityGlyph()).isEqualTo("BULL");
        assertThat(output.priorityOccurrences()).isEqualTo(6); // top, rows 1+2, and both locks
        assertThat(output.timerDigit()).isEqualTo(3); // digital root of 2×6
    }

    @Test void rejectsAmbiguousRowsAndValueOneLocks() {
        var ambiguous = new HieroglyphicsInput(List.of("Male","Bull","Urn","Eye of Horus","Ankh"), List.of("ABC","ABCD","ABCDE"), List.of(6,10,15), "BC", "DE");
        assertThat(result(ambiguous)).isInstanceOf(SolveFailure.class);
        var valueOneLock = input(List.of("Male","Bull","Urn","Eye of Horus","Ankh"), "AB", "DE");
        assertThat(result(valueOneLock)).isInstanceOf(SolveFailure.class);
    }

    private static HieroglyphicsInput input(List<String> names, String anubis, String horus) {
        return new HieroglyphicsInput(names, List.of("ABC","ABBD","ACCDE"), List.of(6,9,16), anubis, horus);
    }
    private HieroglyphicsOutput solve(HieroglyphicsInput input) { return ((SolveSuccess<HieroglyphicsOutput>) result(input)).output(); }
    private Object result(HieroglyphicsInput input) { return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input); }
}
