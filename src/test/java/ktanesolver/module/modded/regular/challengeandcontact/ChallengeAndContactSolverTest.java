package ktanesolver.module.modded.regular.challengeandcontact;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ChallengeAndContactSolverTest {
    private final ChallengeAndContactSolver solver = new ChallengeAndContactSolver();

    @Test void decodesThreeStagesAndPersistsDisplayedLettersForSouvenir() {
        BombEntity bomb = bomb(4, 0, false);
        ModuleEntity module = new ModuleEntity();
        assertThat(solve(bomb, module, 1, "NO_EA", "P").answer()).isEqualTo("COOKING"); // ROT13 P -> C
        bomb.getModules().get(0).setSolved(true); // odd solved count: Atbash L -> O
        assertThat(solve(bomb, module, 2, "ROYAL", "L").answer()).isEqualTo("COFFEEBUCKS");
        bomb.getModules().get(0).setSolved(false); // even solved count: ROT13 Q -> D
        var third = result(bomb, module, 3, "AUDIO", "Q");
        assertThat(third).isInstanceOf(SolveSuccess.class);
        assertThat(((SolveSuccess<ChallengeAndContactOutput>) third).solved()).isTrue();
        assertThat(((SolveSuccess<ChallengeAndContactOutput>) third).output().answer()).isEqualTo("CODE");
        assertThat(module.getState().get("challengeAndContactDisplayedLetters")).isEqualTo(java.util.List.of("P", "L", "Q"));
    }

    @Test void litBobAndNoBatteriesBypassesBothCiphers() {
        BombEntity bomb = bomb(5, 0, true);
        assertThat(solve(bomb, new ModuleEntity(), 1, "MUSIC", "C").answer()).isEqualTo("CHORDS");
    }

    @Test void stageOneReplacesAFailedAttempt() {
        BombEntity bomb = bomb(4, 1, false);
        ModuleEntity module = new ModuleEntity();
        solve(bomb, module, 1, "NO_EA", "P");
        assertThat(solve(bomb, module, 1, "INDICATOR", "S").decodedPrefix()).isEqualTo("F");
        assertThat(module.getState().get("challengeAndContactDisplayedLetters")).isEqualTo(java.util.List.of("S"));
    }

    @Test void rejectsInvalidOrOutOfOrderObservations() {
        BombEntity bomb = bomb(4, 0, false);
        ModuleEntity module = new ModuleEntity();
        assertThat(result(bomb, module, 2, "PORT", "Z")).isInstanceOf(SolveFailure.class);
        assertThat(result(bomb, module, 1, "UNKNOWN", "A")).isInstanceOf(SolveFailure.class);
        assertThat(result(bomb, module, 1, "VANILLA", "AB")).isInstanceOf(SolveFailure.class);
    }

    private ChallengeAndContactOutput solve(BombEntity bomb, ModuleEntity module, int stage, String clue, String shown) {
        return ((SolveSuccess<ChallengeAndContactOutput>) result(bomb, module, stage, clue, shown)).output();
    }
    private Object result(BombEntity bomb, ModuleEntity module, int stage, String clue, String shown) {
        return solver.solve(new RoundEntity(), bomb, module, new ChallengeAndContactInput(stage, clue, shown));
    }
    private static BombEntity bomb(int modules, int batteries, boolean bob) {
        BombEntity bomb = new BombEntity();
        bomb.setAaBatteryCount(batteries);
        bomb.setIndicators(new HashMap<>(Map.of("BOB", bob)));
        for (int i = 0; i < modules; i++) bomb.getModules().add(new ModuleEntity());
        return bomb;
    }
}
