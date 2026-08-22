package ktanesolver.module.modded.regular.coloredkeys;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.coloredkeys.ColoredKeysInput.Key;

class ColoredKeysSolverTest {
    @Test void scoresEveryConditionAndPersistsAllSouvenirFacts() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("A1B2C3"); bomb.setIndicators(Map.of("MSA", true));
        bomb.setAaBatteryCount(2); bomb.replacePortPlates(List.of(Set.of(PortType.RJ45)));
        ModuleEntity module = new ModuleEntity();
        var input = new ColoredKeysInput("red", "blue", List.of(new Key("red", "R"), new Key("green", "X"), new Key("yellow", "Y"), new Key("purple", "Z")));
        @SuppressWarnings("unchecked")
        ColoredKeysOutput output = ((SolveSuccess<ColoredKeysOutput>) new ColoredKeysSolver().solve(new RoundEntity(), bomb, module, input)).output();
        assertThat(output.keyPosition()).isEqualTo(1);
        assertThat(module.getState()).containsEntry("coloredKeysDisplayWord", "red").containsEntry("coloredKeysDisplayColor", "blue");
        assertThat(module.getState().get("coloredKeysLetters")).isEqualTo(List.of("R", "X", "Y", "Z"));
    }
}
