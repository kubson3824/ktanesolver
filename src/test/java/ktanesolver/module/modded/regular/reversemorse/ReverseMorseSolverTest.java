package ktanesolver.module.modded.regular.reversemorse;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.reversemorse.ReverseMorseInput.Observation;

class ReverseMorseSolverTest {
	private final ReverseMorseSolver solver = new ReverseMorseSolver();

	@Test
	void decodesEverySymbolAndColorTableCell() {
		List<Observation> all = new ArrayList<>();
		for (char symbol : ReverseMorseSolver.SYMBOLS.toCharArray())
			for (String color : ReverseMorseSolver.COLORS) all.add(new Observation(Character.toString(symbol), color));
		StringBuilder decoded = new StringBuilder();
		for (int offset = 0; offset < all.size(); offset += 6)
			decoded.append(ReverseMorseSolver.decode(all.subList(offset, offset + 6)));
		assertThat(decoded.toString()).isEqualTo(ReverseMorseSolver.TABLE);
	}

	@Test
	void returnsParserValidTransmissionsAndRecordsAllSouvenirFacts() {
		List<Observation> first = observations("ALQTXZ", "RED");
		List<Observation> second = observations("ALQTXZ", "ORANGE");
		ModuleEntity module = module();
		SolveSuccess<ReverseMorseOutput> result = success(module, new ReverseMorseInput(first, second, 1));

		assertThat(result.output().firstMessage()).isEqualTo("X4IQ7S");
		assertThat(result.output().secondMessage()).isEqualTo("EJZG3R");
		assertThat(result.output().firstTransmission()).containsExactly(
			"-..-", "br", "....-", "br", "..", "br", "--.-", "br", "--...", "br", "...", "br", "tx");
		assertThat(result.output().secondTransmission()).endsWith("--.", "br", "...--", "br", ".-.", "br", "tx");
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKeys("message1Observations", "message2Observations");
	}

	@Test
	void secondStageRetryTransmitsOnlyTheStillActiveMessage() {
		ReverseMorseOutput output = success(module(), new ReverseMorseInput(
			observations("AAAAAA", "RED"), observations("LLLLLL", "GREEN"), 2)).output();
		assertThat(output.currentStage()).isEqualTo(2);
		assertThat(output.secondTransmission()).containsOnly(".--.", "br", "tx");
	}

	@Test
	void validatesStageMessageLengthSymbolsAndColors() {
		List<Observation> valid = observations("AAAAAA", "RED");
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new ReverseMorseInput(valid.subList(0, 5), valid, 1)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new ReverseMorseInput(
			observations("BAAAAA", "RED"), valid, 1))).isInstanceOf(SolveFailure.class);
		List<Observation> badColor = new ArrayList<>(valid); badColor.set(0, new Observation("A", "CYAN"));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new ReverseMorseInput(badColor, valid, 1)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new ReverseMorseInput(valid, valid, 3)))
			.isInstanceOf(SolveFailure.class);
	}

	private static List<Observation> observations(String symbols, String color) {
		return symbols.chars().mapToObj(symbol -> new Observation(Character.toString((char) symbol), color)).toList();
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<ReverseMorseOutput> success(ModuleEntity module, ReverseMorseInput input) {
		return (SolveSuccess<ReverseMorseOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.REVERSE_MORSE);
		module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module;
	}
}
