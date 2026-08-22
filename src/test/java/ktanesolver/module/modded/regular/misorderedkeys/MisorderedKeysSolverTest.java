package ktanesolver.module.modded.regular.misorderedkeys;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.misorderedkeys.MisorderedKeysInput.Color;
import ktanesolver.module.modded.regular.misorderedkeys.MisorderedKeysInput.Key;

class MisorderedKeysSolverTest {
    @Test
    void derivesBothPermutationsAndPressesFirstValuesByAscendingSecondValue() {
        List<Key> keys = List.of(
                new Key(Color.RED, Color.RED, "1"),
                new Key(Color.RED, Color.RED, "1"),
                new Key(Color.RED, Color.RED, "5"),
                new Key(Color.RED, Color.RED, "3"),
                new Key(Color.RED, Color.RED, "6"),
                new Key(Color.RED, Color.RED, "4"));
        ModuleEntity module = new ModuleEntity();

        var result = (SolveSuccess<MisorderedKeysOutput>) new MisorderedKeysSolver().solve(
                new RoundEntity(), new BombEntity(), module, new MisorderedKeysInput(keys, 6));

        assertThat(result.output().firstValues()).containsExactly(1, 2, 3, 4, 5, 6);
        assertThat(result.output().secondValues()).containsExactly(1, 2, 5, 3, 6, 4);
        assertThat(result.output().pressOrder()).containsExactly(1, 2, 4, 6, 3, 5);
        assertThat(result.output().twitchCommand()).isEqualTo("press 124635");
        assertThat(module.getState()).containsKeys("misorderedKeysKeys", "misorderedKeysK");
    }
}
