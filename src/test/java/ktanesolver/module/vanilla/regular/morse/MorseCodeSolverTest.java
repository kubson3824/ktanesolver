package ktanesolver.module.vanilla.regular.morse;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.vanilla.regular.translated.TranslatedVanillaData;

class MorseCodeSolverTest {
	@Test
	void resolvesCompleteExactWordDespiteCloseRunnerUp() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MORSE_CODE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		var word = TranslatedVanillaData.morseWords("DE").stream()
			.filter(candidate -> candidate.word().equals("BRÜCKE")).findFirst().orElseThrow();

		SolveSuccess<MorseOutput> result = (SolveSuccess<MorseOutput>) new MorseCodeSolver().solve(
			new RoundEntity(), new BombEntity(), module, new MorseInput(null, "DE", String.join(" ", word.symbols())));

		assertThat(result.output().candidates().getFirst().word()).isEqualTo("BRÜCKE");
		assertThat(result.output().candidates().getFirst().confidence()).isEqualTo(1.0);
		assertThat(result.output().candidates().get(1).confidence()).isEqualTo(0.833);
		assertThat(result.output().resolved()).isTrue();
		assertThat(result.solved()).isTrue();
	}

	@Test
	void resolvesCyclicKoreanMorseFromAnyStartingCharacter() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MORSE_CODE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		var word = TranslatedVanillaData.morseWords("KO").getFirst();
		var rotated = new java.util.ArrayList<>(word.symbols());
		java.util.Collections.rotate(rotated, -2);

		SolveSuccess<MorseOutput> result = (SolveSuccess<MorseOutput>) new MorseCodeSolver().solve(
			new RoundEntity(), new BombEntity(), module, new MorseInput(null, "KO", String.join(" ", rotated)));

		assertThat(result.output().candidates().getFirst().word()).isEqualTo("김밥");
		assertThat(result.output().candidates().getFirst().frequency()).isEqualTo(3.505);
		assertThat(result.output().resolved()).isTrue();
	}
}
