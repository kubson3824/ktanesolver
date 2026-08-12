package ktanesolver.module.modded.regular.regularcrazytalk;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class RegularCrazyTalkSolverTest {
    @Test
    void appliesTheOfficialDefaultSeedTableAndPersistsSouvenirAnswers() {
        var phrases = List.of(
            new RegularCrazyTalkPhrase("It says: “We just blew up.”", 0),
            new RegularCrazyTalkPhrase("We ran out of time.", 9),
            new RegularCrazyTalkPhrase("You cut out.", 9),
            new RegularCrazyTalkPhrase("You just cut out.", 9),
            new RegularCrazyTalkPhrase("Were you saying something?", 9)
        );
        var module = new ModuleEntity();
        var result = new RegularCrazyTalkSolver().solve(new RoundEntity(), new BombEntity(), module, new RegularCrazyTalkInput(phrases));
        var output = ((SolveSuccess<RegularCrazyTalkOutput>) result).output();
        assertThat(output.position()).isEqualTo(1);
        assertThat(output.digit()).isZero();
        assertThat(output.hold()).isEqualTo(4);
        assertThat(output.release()).isEqualTo(2);
        assertThat(output.embellishment()).isEqualTo("It says: “[PHRASE]”");
        assertThat(module.getState()).containsEntry("regularCrazyTalkDigit", 0)
            .containsEntry("regularCrazyTalkModifier", "It says: “[PHRASE]”");
    }
}
