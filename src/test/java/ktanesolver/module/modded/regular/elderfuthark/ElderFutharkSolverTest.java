package ktanesolver.module.modded.regular.elderfuthark;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ElderFutharkSolverTest {
    private final ElderFutharkSolver solver = new ElderFutharkSolver();

    @Test void interweavesPadsEncryptsAndPersistsTheShownRunes() {
        ModuleEntity module = new ModuleEntity();
        ElderFutharkOutput output = solve(module, "ABC123", List.of("Ansuz", "Fehu", "Isa"));
        assertThat(output.encryptionKey()).isEqualTo("afinesshauui");
        assertThat(output.encryptedRunes()).containsExactly(
            List.of("Ansuz", "Sowulo", "Dagaz", "Eihwaz", "Uruz"),
            List.of("Ansuz", "Thurisaz", "Othila", "Uruz"),
            List.of("Fehu", "Perthro", "Isa"));
        assertThat(module.getState().get("elderFutharkRunes")).isEqualTo(List.of("Ansuz", "Fehu", "Isa"));
    }

    @Test void cyclesTheInterwovenKeyRightByTheSerialDigitSumModuloSix() {
        assertThat(solve(new ModuleEntity(), "ABC124", List.of("Ansuz", "Fehu", "Isa")).encryptionKey()).isEqualTo("safinesshauu");
    }

    @Test void rejectsUnknownRunesAndMissingSerials() {
        assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), new ModuleEntity(), new ElderFutharkInput(List.of("Ansuz", "Nope", "Isa")))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new ElderFutharkInput(List.of("Ansuz", "Fehu", "Isa")))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private ElderFutharkOutput solve(ModuleEntity module, String serial, List<String> runes) {
        return ((SolveSuccess<ElderFutharkOutput>) solver.solve(new RoundEntity(), bomb(serial), module, new ElderFutharkInput(runes))).output();
    }

    private static BombEntity bomb(String serial) { BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial); return bomb; }
}
