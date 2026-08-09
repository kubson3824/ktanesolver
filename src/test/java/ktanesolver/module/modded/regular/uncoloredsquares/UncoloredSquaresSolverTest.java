package ktanesolver.module.modded.regular.uncoloredsquares;

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

class UncoloredSquaresSolverTest {
	private final UncoloredSquaresSolver solver = new UncoloredSquaresSolver();

	@Test
	void containsEveryManualPattern() {
		String[][] expected = {
			{null, "##|#", " #|##", "#|##|#", "##| #"},
			{"#|#", null, "#|#|##", "##|##", " ##|##"},
			{"#|##| #", "#|##", null, "###| #", " #|###"},
			{" #|##|#", "##|#|#", " #| #|##", null, " #|##| #"},
			{"##| ##", "###|  #", "##", "###|#", null}
		};
		for (int other = 0; other < 5; other++) for (int first = 0; first < 5; first++) if (other != first) {
			List<UncoloredSquaresColor> grid = gridForPair(first, other);
			SolveSuccess<UncoloredSquaresOutput> result = solve(module(), grid);
			assertThat(String.join("|", result.output().pattern())).isEqualTo(expected[other][first]);
			assertThat(result.output().firstColor().ordinal()).isEqualTo(first);
			assertThat(result.output().otherColor().ordinal()).isEqualTo(other);
		}
	}

	@Test
	void excludesPlacementsCoveringBlackSquaresAndKeepsFirstStageFacts() {
		ModuleEntity module = module();
		SolveSuccess<UncoloredSquaresOutput> first = solve(module, gridForPair(0, 1));
		assertThat(first.solved()).isFalse();
		assertThat(module.getState()).containsEntry("firstStageColor1", "Red").containsEntry("firstStageColor2", "Green");

		List<UncoloredSquaresColor> later = new ArrayList<>(gridForPair(2, 3));
		later.set(0, UncoloredSquaresColor.BLACK);
		later.set(1, UncoloredSquaresColor.BLACK);
		SolveSuccess<UncoloredSquaresOutput> next = solve(module, later);
		assertThat(next.output().placements()).allSatisfy(cells -> assertThat(cells).doesNotContain("A1", "B1"));
		assertThat(module.getState()).containsEntry("firstStageColor1", "Red").containsEntry("firstStageColor2", "Green");
	}

	@Test
	void solvesWithThreeOrFewerSquaresRemainingAndValidatesTie() {
		List<UncoloredSquaresColor> grid = new ArrayList<>(List.of(
			UncoloredSquaresColor.RED, UncoloredSquaresColor.BLUE, UncoloredSquaresColor.BLUE, UncoloredSquaresColor.BLACK,
			UncoloredSquaresColor.GREEN, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK,
			UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK,
			UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK, UncoloredSquaresColor.BLACK));
		SolveSuccess<UncoloredSquaresOutput> solved = solve(module(), grid);
		assertThat(solved.solved()).isTrue();
		assertThat(solved.output().willSolve()).isTrue();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new UncoloredSquaresInput(new ArrayList<>(java.util.Collections.nCopies(16, UncoloredSquaresColor.RED)))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<UncoloredSquaresOutput> solve(ModuleEntity module, List<UncoloredSquaresColor> grid) {
		return (SolveSuccess<UncoloredSquaresOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new UncoloredSquaresInput(grid));
	}

	private static List<UncoloredSquaresColor> gridForPair(int first, int other) {
		List<UncoloredSquaresColor> colors = List.of(UncoloredSquaresColor.values()).subList(0, 5);
		List<UncoloredSquaresColor> grid = new ArrayList<>();
		grid.add(colors.get(first)); grid.add(colors.get(other));
		grid.add(colors.get(first)); grid.add(colors.get(other));
		for (int color = 0; color < 5; color++) if (color != first && color != other)
			for (int count = 0; count < 4; count++) grid.add(colors.get(color));
		return grid;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.UNCOLORED_SQUARES);
		module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module;
	}
}
