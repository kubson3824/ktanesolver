package ktanesolver.module.modded.regular.alphabet;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class AlphabetSolverTest {

    private final AlphabetSolver solver = new AlphabetSolver();

    @Test
    void catalogUsesAlphabetMetadata() {
        ModuleInfo info = AlphabetSolver.class.getAnnotation(ModuleInfo.class);

        assertThat(info).isNotNull();
        assertThat(info.name()).isEqualTo("Alphabet");
        assertThat(info.type()).isEqualTo(ModuleType.ALPHABET);
    }

    @Test
    void spellsOneWordWhenAllFourLettersFitABankEntry() {
        AlphabetOutput output = solve(List.of("A", "R", "G", "F"));

        assertThat(output.pressOrder()).containsExactly("ARGF");
    }

    @Test
    void spellsTwoWordsWhenLettersSplitAcrossTwoEntries() {
        AlphabetOutput output = solve(List.of("A", "C", "G", "S"));

        assertThat(output.pressOrder()).containsExactly("AC", "GS");
    }

    @Test
    void tieBreaksToAlphabeticallyFirstWordAmongSameLength() {
        // JR and OP are both 2-letter bank words; JR < OP alphabetically
        AlphabetOutput output = solve(List.of("J", "R", "O", "P"));

        assertThat(output.pressOrder()).containsExactly("JR", "OP");
    }

    @Test
    void pressesRemainingLettersAlphabeticallyWhenNoWordCanBeFormed() {
        AlphabetOutput output = solve(List.of("B", "E", "H", "X"));

        assertThat(output.pressOrder()).containsExactly("B", "E", "H", "X");
    }

    @Test
    void spellsWordThenPressesRemainingLettersAlphabetically() {
        // GS is a bank word; B and Z remain
        AlphabetOutput output = solve(List.of("G", "S", "B", "Z"));

        assertThat(output.pressOrder()).containsExactly("GS", "B", "Z");
    }

    @Test
    void failsWhenInputDoesNotContainExactlyFourLetters() {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(List.of("A", "B"))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<AlphabetOutput>) result).getReason())
            .isEqualTo("Alphabet requires exactly 4 letters");
        assertThat(module.isSolved()).isFalse();
    }

    @Test
    void failsWhenAnyLetterIsNotASingleCharacter() {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(List.of("A", "AB", "C", "D"))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<AlphabetOutput>) result).getReason())
            .isEqualTo("Each letter must be a single character");
        assertThat(module.isSolved()).isFalse();
    }

    // --- helpers ---

    private AlphabetOutput solve(List<String> letters) {
        ModuleEntity module = module();
        SolveResult<AlphabetOutput> result = solver.solve(
            new RoundEntity(), new BombEntity(), module,
            new AlphabetInput(letters)
        );

        assertThat(result).isInstanceOf(SolveSuccess.class);
        assertThat(module.isSolved()).isTrue();

        return ((SolveSuccess<AlphabetOutput>) result).output();
    }

    private static ModuleEntity module() {
        ModuleEntity module = new ModuleEntity();
        module.setType(ModuleType.ALPHABET);
        module.setSolution(new HashMap<>());
        module.setState(new HashMap<>());
        return module;
    }
}
