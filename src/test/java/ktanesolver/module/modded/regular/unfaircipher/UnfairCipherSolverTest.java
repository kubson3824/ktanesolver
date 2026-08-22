package ktanesolver.module.modded.regular.unfaircipher;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class UnfairCipherSolverTest {
    private final UnfairCipherSolver solver = new UnfairCipherSolver();

    @Test void decryptsTheMessageAndPlansTimedAndRepeatedPresses() {
        BombEntity bomb = bomb();
        RoundEntity round = new RoundEntity();
        round.setStartTime(Instant.parse("2026-08-13T12:00:00Z"));
        String keyA = UnfairCipherSolver.calculateKeyA(bomb, 7);
        String keyB = UnfairCipherSolver.calculateKeyB(LocalDate.of(2026, 8, 13));
        String keyC = UnfairCipherSolver.playfairEncrypt(keyB, keyA);
        int offset = UnfairCipherSolver.calculateOffset(bomb);
        String encrypted = UnfairCipherSolver.encryptInstructions(keyA, keyC, offset, "PCRMITREPSTR");
        ModuleEntity module = new ModuleEntity();

        @SuppressWarnings("unchecked")
        UnfairCipherOutput output = ((SolveSuccess<UnfairCipherOutput>) solver.solve(
            round, bomb, module, new UnfairCipherInput(encrypted, 7, 2))).output();

        assertThat(keyA).isEqualTo("AEFCGAA");
        assertThat(keyB).isEqualTo("CQB");
        assertThat(offset).isEqualTo(-1);
        assertThat(output.instructions()).containsExactly("PCR", "MIT", "REP", "STR");
        assertThat(output.actions()).containsExactly(
            new UnfairCipherAction("PCR", "RED", List.of()),
            new UnfairCipherAction("MIT", "INNER", List.of("00", "10", "20", "30", "40", "50")),
            new UnfairCipherAction("REP", "INNER", List.of()),
            new UnfairCipherAction("STR", "BLUE", List.of()));
        assertThat(module.getState().get("unfairCipherEncryptedMessage")).isEqualTo(encrypted);
    }

    @Test void implementsPrimeChecksSubTimingAndBobInstantSolve() {
        BombEntity bomb = bomb();
        assertThat(UnfairCipherSolver.planActions(bomb, 7, 0, List.of("PRN", "CHK", "SUB", "IKE")))
            .containsExactly(
                new UnfairCipherAction("PRN", "INNER", List.of()),
                new UnfairCipherAction("CHK", "OUTER", List.of()),
                new UnfairCipherAction("SUB", "OUTER", List.of("00", "11", "22", "33", "44", "55")),
                new UnfairCipherAction("IKE", "RED", List.of()));
        bomb.setIndicators(Map.of("BOB", true));
        bomb.setAaBatteryCount(2);
        assertThat(UnfairCipherSolver.planActions(bomb, 1, 0, List.of("EAT", "BOB", "PCR", "PCG")))
            .containsExactly(
                new UnfairCipherAction("EAT", "INNER", List.of()),
                new UnfairCipherAction("BOB", "INNER", List.of()));
    }

    @Test void rejectsMalformedOrIncorrectMessages() {
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new UnfairCipherInput("ABC", 7, 0)))
            .isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new UnfairCipherInput("AAAAAAAAAAAA", 7, 0)))
            .isInstanceOf(SolveFailure.class);
    }

    private static BombEntity bomb() {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("ABC123");
        bomb.setAaBatteryCount(2);
        bomb.setIndicators(Map.of("CAR", true));
        bomb.replacePortPlates(List.of(new LinkedHashSet<>(List.of(PortType.SERIAL))));
        return bomb;
    }
}
