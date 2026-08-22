package ktanesolver.module.modded.regular.stickynotes;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class StickyNotesSolverTest {
    @Test void choosesTheFirstDepartmentTaskInManualOrderNotScreenOrder() {
        List<String> notes = List.of("Check timesheets of employees","Pay employees","Make coffee for visitors","x","x","x","x","x","x","x");
        StickyNotesOutput output = solve("Monday", notes);
        assertThat(output.notePosition()).isEqualTo(3); assertThat(output.task()).isEqualTo("Make coffee for visitors");
    }

    @Test void weekendsChooseTheAlphabeticallyFirstPersonalTask() {
        List<String> notes = List.of("Training for 10km run","Quiz night with Royal","Pay employees","x","x","x","x","x","x","x");
        assertThat(solve("Sunday", notes).notePosition()).isEqualTo(2);
    }

    @SuppressWarnings("unchecked") private static StickyNotesOutput solve(String day,List<String> notes){return((SolveSuccess<StickyNotesOutput>)new StickyNotesSolver().solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),new StickyNotesInput(day,notes))).output();}
}
