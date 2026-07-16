package ktanesolver.module.modded.regular.threedmaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class ThreeDMazeSolverTest {

	private static final Map<String, String> OFFICIAL_LAYOUT_HASHES = Map.of(
		"A,B,C", "ebf7b5c3d1f4ad6325da86daafcb82a29b96e0f660aeb9c28dd8fd052fc06e54",
		"A,B,D", "b0ea0c6ac0458eb0e3dc79797d3161534aed060246cac3ec9e73a76e2392ba53",
		"A,B,H", "04ba1880e7ef5bd864916cffde8280bc814025ec206b7ded411d40e96e604886",
		"A,C,D", "d6752628a1f0b0dd704ebdac67dce8043337a86d12d7d04bb623770e5e6a1fca",
		"A,C,H", "7af6b8c86e8c94fe0a0b085cca522f3f1d8dc77bf3467de0d459d43f28f1537b",
		"A,D,H", "23013425364378d0536cb5aebf8ee920783c594a15fa313fa0c3e7dc4fd7efb4",
		"B,C,D", "267ace5f340cd6ea5c3f1a16811dd5e4fae5236945febcc6408c3d424a1bbf10",
		"B,C,H", "14781c506fe23393bc21d6c218c9b3c58b800a2670e3b911be802246f977bba1",
		"B,D,H", "cc9216cfdd3f7e7b0ad3038c36918c064ce8ebf6dcb085cc14f71869732930ca",
		"C,D,H", "5b3d8c0aabf0cfc729701065df2b78ca252e5258c903e0d599e19742e6ec2b1d"
	);

	private final ThreeDMazeSolver solver = new ThreeDMazeSolver();

	@Test
	void defaultLayoutsMatchTheOfficialModuleData() {
		OFFICIAL_LAYOUT_HASHES.forEach((triple, expected) ->
			assertThat(layoutHash(triple, ThreeDMazeDefinitions.getMaze(triple))).as(triple).isEqualTo(expected));
	}

	@Test
	void orderedObservationInfersPositionAndLeavesStarPhaseUnsolved() {
		ModuleEntity module = module();
		var result = (SolveSuccess<ThreeDMazeOutput>) solver.solve(
			new RoundEntity(), bomb("A0B0C"), module,
			new ThreeDMazeInput(List.of("A", "B", "C"), null, null, null, null, "A", new int[] { 0, 1, 1, 1 })
		);

		assertThat(result.solved()).isFalse();
		assertThat(module.isSolved()).isFalse();
		assertThat(result.output().phase()).isEqualTo("go_to_star");
		assertThat(result.output()).extracting(ThreeDMazeOutput::startRow, ThreeDMazeOutput::startCol, ThreeDMazeOutput::startFacing)
			.containsExactly(0, 5, "N");
	}

	@Test
	void finalRouteFindsTheFirstWallAndIncludesTheSolvingMove() {
		ModuleEntity module = module();
		var result = (SolveSuccess<ThreeDMazeOutput>) solver.solve(
			new RoundEntity(), bomb("A0B0C"), module,
			new ThreeDMazeInput(List.of("A", "B", "C"), "S", 0, 0, "N", null, null)
		);

		assertThat(result.solved()).isTrue();
		assertThat(module.isSolved()).isTrue();
		assertThat(result.output()).extracting(ThreeDMazeOutput::goalRow, ThreeDMazeOutput::goalCol).containsExactly(3, 0);
		assertThat(result.output().moves()).isNotEmpty().endsWith(ThreeDMazeMove.FORWARD);
	}

	@Test
	void edgeworkCoordinatesWrapWithModuloEight() {
		BombEntity bomb = bomb("A9B0C");
		for (int i = 0; i < 10; i++) bomb.getIndicators().put("A" + i, false);
		var result = (SolveSuccess<ThreeDMazeOutput>) solver.solve(
			new RoundEntity(), bomb, module(),
			new ThreeDMazeInput(List.of("A", "B", "C"), "S", 0, 0, "N", null, null)
		);

		assertThat(result.output()).extracting(ThreeDMazeOutput::goalRow, ThreeDMazeOutput::goalCol).containsExactly(3, 0);
	}

	private static String layoutHash(String triple, ThreeDMazeMaze maze) {
		StringBuilder value = new StringBuilder();
		appendWalls(value, maze.horizontalWalls());
		value.append('|');
		appendWalls(value, maze.verticalWalls());
		value.append('|');
		for (int row = 0; row < 8; row++) {
			for (int col = 0; col < 8; col++) {
				value.append(ThreeDMazeDefinitions.isStarCell(triple, row, col)
					? '*' : maze.letterGrid()[row][col] == null ? ' ' : maze.letterGrid()[row][col]);
			}
		}
		try {
			return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.toString().getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new AssertionError(e);
		}
	}

	private static void appendWalls(StringBuilder value, boolean[][] walls) {
		for (boolean[] row : walls) for (boolean wall : row) value.append(wall ? '1' : '0');
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
