package ktanesolver.module.modded.regular.poetry;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class PoetrySolverTest {
	private static final List<String> MELANIE_TIE = List.of(
		"clarity", "flow", "energy", "heart", "words", "patience"
	);
	private final PoetrySolver solver = new PoetrySolver();

	@Test
	void findsEveryClosestWordAndSolvesAfterThreeStages() {
		ModuleEntity module = new ModuleEntity();

		SolveSuccess<PoetryOutput> first = success(module, new PoetryInput("melanie", MELANIE_TIE, false));
		assertThat(first.output()).isEqualTo(new PoetryOutput(1, List.of("clarity", "energy"), List.of(1, 3)));
		assertThat(first.solved()).isFalse();
		assertThat(module.getState()).containsEntry("girl", "Melanie");

		SolveSuccess<PoetryOutput> second = success(module, new PoetryInput("Melanie", List.of(
			"sunshine", "ocean", "reflection", "identity", "black", "solitary"
		), false));
		assertThat(second.output()).isEqualTo(new PoetryOutput(2, List.of("sunshine"), List.of(1)));
		assertThat(second.solved()).isFalse();

		SolveSuccess<PoetryOutput> third = success(module, new PoetryInput("Melanie", List.of(
			"crowd", "weather", "morality", "future", "search", "cookies"
		), false));
		assertThat(third.output()).isEqualTo(new PoetryOutput(3, List.of("crowd"), List.of(1)));
		assertThat(third.solved()).isTrue();
		assertThat(module.isSolved()).isTrue();
		assertThat((List<?>)module.getState().get("stages")).hasSize(3);
	}

	@Test
	void replacesTheRegeneratedStageAfterAReportedStrike() {
		ModuleEntity module = new ModuleEntity();
		success(module, new PoetryInput("Hana", List.of(
			"bunny", "lovely", "romance", "cookies", "compassion", "creation"
		), false));
		success(module, new PoetryInput("Hana", List.of(
			"clarity", "flow", "fatigue", "hollow", "energy", "sunshine"
		), false));

		SolveSuccess<PoetryOutput> replacement = success(module, new PoetryInput("Hana", List.of(
			"bunny", "relax", "crowd", "heart", "weather", "words"
		), true));

		assertThat(replacement.output()).isEqualTo(new PoetryOutput(2, List.of("bunny"), List.of(1)));
		assertThat((List<?>)module.getState().get("stages")).hasSize(2);
	}

	@Test
	void rejectsInvalidDisplaysAndGirlChangesWithoutChangingState() {
		ModuleEntity module = new ModuleEntity();
		success(module, new PoetryInput("Lacy", List.of(
			"black", "solitary", "failure", "search", "patience", "focus"
		), false));
		int stages = ((List<?>)module.getState().get("stages")).size();

		List<PoetryInput> invalid = List.of(
			new PoetryInput("Monika", MELANIE_TIE, false),
			new PoetryInput("Lacy", List.of("black"), false),
			new PoetryInput("Lacy", List.of("black", "black", "failure", "search", "patience", "focus"), false),
			new PoetryInput("Lacy", List.of("black", "solitary", "failure", "search", "patience", "Melanie"), false),
			new PoetryInput("Jane", MELANIE_TIE, false)
		);
		for (PoetryInput input : invalid) assertThat(solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, null))
			.isInstanceOf(SolveFailure.class);
		assertThat((List<?>)module.getState().get("stages")).hasSize(stages);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<PoetryOutput> success(ModuleEntity module, PoetryInput input) {
		SolveResult<PoetryOutput> result = solver.solve(new RoundEntity(), new BombEntity(), module, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<PoetryOutput>)result;
	}
}
