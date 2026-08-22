package ktanesolver.module.modded.regular.sevendeadlysins;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.sevendeadlysins.SevenDeadlySinsInput.Sin;

class SevenDeadlySinsSolverTest {
    @Test
    void findsAParserReadyAdjacentPath() {
        var result = new SevenDeadlySinsSolver().solve(
            new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new SevenDeadlySinsInput(List.of(Sin.LUST, Sin.GLUTTONY, Sin.GREED, Sin.SLOTH, Sin.WRATH, Sin.ENVY, Sin.PRIDE))
        );

        var success = (SolveSuccess<SevenDeadlySinsOutput>) result;
        assertThat(success.output().pressPositions()).containsExactly(1, 2, 3, 4, 5, 6, 7);
        assertThat(success.output().pressSequence()).containsExactlyElementsOf(List.of(Sin.values()));
        assertThat(success.output().twitchCommand()).isEqualTo("press 1 2 3 4 5 6 7");
    }
}
