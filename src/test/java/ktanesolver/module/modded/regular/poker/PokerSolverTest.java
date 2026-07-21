package ktanesolver.module.modded.regular.poker;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class PokerSolverTest {
	private static final List<String> RESPONSES = List.of(
		"TERRIBLE_PLAY", "AWFUL_PLAY", "REALLY", "REALLY_REALLY", "SURE_ABOUT_THAT", "ARE_YOU_SURE"
	);
	private static final Map<String, Set<String>> TRUTHS = Map.of(
		"ACE_OF_SPADES", Set.of("TERRIBLE_PLAY", "REALLY", "SURE_ABOUT_THAT"),
		"KING_OF_HEARTS", Set.of("TERRIBLE_PLAY", "AWFUL_PLAY", "ARE_YOU_SURE"),
		"FIVE_OF_DIAMONDS", Set.of("TERRIBLE_PLAY", "AWFUL_PLAY", "REALLY_REALLY", "ARE_YOU_SURE"),
		"TWO_OF_CLUBS", Set.of("SURE_ABOUT_THAT", "ARE_YOU_SURE")
	);

	private final PokerSolver solver = new PokerSolver();

	@Test
	void followsTheThreeStageRevealAndPersistsOnlyObservedFacts() {
		BombEntity bomb = bomb("ABC123", 0, 0, Map.of());
		ModuleEntity module = module();

		assertThat(solver.solve(new RoundEntity(), bomb, module, input(2, null, "REALLY", null, null)))
			.isInstanceOf(SolveFailure.class);

		PokerOutput first = success(solver.solve(new RoundEntity(), bomb, module,
			input(1, "ACE_OF_SPADES", null, null, null)));
		assertThat(first).isEqualTo(new PokerOutput(1, "MAX_RAISE", null, null));
		assertThat(module.isSolved()).isFalse();
		assertThat(module.getState()).containsOnlyKeys("starterCard", "call");

		assertThat(solver.solve(new RoundEntity(), bomb, module,
			input(3, null, null, 25, List.of("HEART", "HEART", "HEART", "HEART"))))
			.isInstanceOf(SolveFailure.class);

		PokerOutput second = success(solver.solve(new RoundEntity(), bomb, module,
			input(2, null, "REALLY", null, null)));
		assertThat(second).isEqualTo(new PokerOutput(2, "MAX_RAISE", "TRUTH", null));
		assertThat(module.isSolved()).isFalse();
		assertThat(module.getState()).containsEntry("opponentResponse", "REALLY").containsEntry("truthOrBluff", "TRUTH");

		assertThat(solver.solve(new RoundEntity(), bomb, module,
			input(3, null, null, 25, List.of("HEART", "HEART", "HEART"))))
			.isInstanceOf(SolveFailure.class);

		PokerOutput third = success(solver.solve(new RoundEntity(), bomb, module,
			input(3, null, null, 25, List.of("HEART", "HEART", "HEART", "HEART"))));
		assertThat(third).isEqualTo(new PokerOutput(3, "MAX_RAISE", "TRUTH", 1));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("chipValue", 25)
			.containsEntry("finalCards", List.of("HEART", "HEART", "HEART", "HEART"));
	}

	@ParameterizedTest
	@MethodSource("callCases")
	void followsRepresentativeBranchesOfEveryStarterFlowchart(String starter, BombEntity bomb, String expected) {
		PokerOutput output = success(solver.solve(new RoundEntity(), bomb, module(), input(1, starter, null, null, null)));

		assertThat(output.call()).isEqualTo(expected);
	}

	@ParameterizedTest
	@MethodSource("truthCases")
	void matchesTheCompleteTruthBluffTable(String starter, String response, String expected) {
		ModuleEntity module = module();
		success(solver.solve(new RoundEntity(), bomb("ABC123", 0, 0, Map.of()), module,
			input(1, starter, null, null, null)));

		PokerOutput output = success(solver.solve(new RoundEntity(), bomb("ABC123", 0, 0, Map.of()), module,
			input(2, null, response, null, null)));

		assertThat(output.truthOrBluff()).isEqualTo(expected);
	}

	@ParameterizedTest
	@MethodSource("betCases")
	void appliesBettingRulesInManualPriorityOrder(
		int chip, String starter, String response, List<String> cards, BombEntity bomb, int expected
	) {
		ModuleEntity module = module();
		module.getState().putAll(Map.of(
			"starterCard", starter,
			"call", "CHECK",
			"opponentResponse", response,
			"truthOrBluff", "BLUFF"
		));

		PokerOutput output = success(solver.solve(new RoundEntity(), bomb, module,
			input(3, null, null, chip, cards)));

		assertThat(output.cardPosition()).isEqualTo(expected);
	}

	private static Stream<Arguments> callCases() {
		return Stream.of(
			Arguments.of("ACE_OF_SPADES", bomb("ABC123", 3, 0, Map.of("FRK", true), PortType.RJ45), "ALL_IN"),
			Arguments.of("ACE_OF_SPADES", bomb("ABC123", 0, 3, Map.of()), "FOLD"),
			Arguments.of("ACE_OF_SPADES", bomb("ABC123", 0, 0, Map.of("CAR", false)), "MAX_RAISE"),
			Arguments.of("KING_OF_HEARTS", bomb("ABC124", 1, 0, Map.of("IND", true), PortType.STEREO_RCA), "ALL_IN"),
			Arguments.of("KING_OF_HEARTS", bomb("ABC123", 2, 0, Map.of(), PortType.PARALLEL), "MIN_RAISE"),
			Arguments.of("KING_OF_HEARTS", bomb("ABC123", 2, 0, Map.of("BOB", false)), "CHECK"),
			Arguments.of("FIVE_OF_DIAMONDS", bomb("ABC123", 2, 0, Map.of("CLR", false), PortType.PS2, PortType.RJ45), "MIN_RAISE"),
			Arguments.of("FIVE_OF_DIAMONDS", bomb("ABC123", 0, 0, Map.of("BOB", true)), "MAX_RAISE"),
			Arguments.of("FIVE_OF_DIAMONDS", bomb("ABC124", 0, 0, Map.of("CAR", true)), "ALL_IN"),
			Arguments.of("TWO_OF_CLUBS", bomb("ABC123", 0, 0, Map.of("TRN", true)), "MAX_RAISE"),
			Arguments.of("TWO_OF_CLUBS", bomb("AB1CD2", 2, 0, Map.of(), PortType.PARALLEL, PortType.SERIAL), "MIN_RAISE"),
			Arguments.of("TWO_OF_CLUBS", bomb("ABC123", 0, 3, Map.of(), PortType.RJ45), "CHECK")
		);
	}

	private static Stream<Arguments> truthCases() {
		return TRUTHS.entrySet().stream().flatMap(entry -> RESPONSES.stream().map(response -> Arguments.of(
			entry.getKey(), response, entry.getValue().contains(response) ? "TRUTH" : "BLUFF"
		)));
	}

	private static Stream<Arguments> betCases() {
		return Stream.of(
			// $25
			bet(25, "ACE_OF_SPADES", "AWFUL_PLAY", cards("HEART", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of("BOB", true)), 4),
			bet(25, "ACE_OF_SPADES", "AWFUL_PLAY", cards("CLUB", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(25, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "HEART", "HEART", "CLUB"), bomb("BCX123", 0, 0, Map.of("FRQ", false)), 2),
			bet(25, "KING_OF_HEARTS", "REALLY", cards("CLUB", "HEART", "DIAMOND", "HEART"), bomb("BCX123", 0, 0, Map.of()), 3),
			bet(25, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "HEART", "HEART", "SPADE"), bomb("BCX123", 3, 2, Map.of()), 3),
			bet(25, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "HEART", "DIAMOND", "HEART"), bomb("BCX123", 0, 0, Map.of()), 2),
			bet(25, "TWO_OF_CLUBS", "ARE_YOU_SURE", cards("CLUB", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(25, "FIVE_OF_DIAMONDS", "TERRIBLE_PLAY", cards("CLUB", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 4),
			bet(25, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "CLUB", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 2),
			bet(25, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("SPADE", "HEART", "CLUB", "HEART"), bomb("BCX123", 0, 0, Map.of()), 1),

			// $50
			bet(50, "KING_OF_HEARTS", "SURE_ABOUT_THAT", cards("CLUB", "CLUB", "CLUB", "HEART"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(50, "TWO_OF_CLUBS", "AWFUL_PLAY", cards("DIAMOND", "HEART", "SPADE", "HEART"), bomb("BCX123", 0, 0, Map.of()), 3),
			bet(50, "KING_OF_HEARTS", "AWFUL_PLAY", cards("HEART", "CLUB", "SPADE", "HEART"), bomb("BCX123", 0, 0, Map.of()), 4),
			bet(50, "ACE_OF_SPADES", "AWFUL_PLAY", cards("HEART", "DIAMOND", "CLUB", "HEART"), bomb("BCX123", 0, 0, Map.of()), 2),
			bet(50, "KING_OF_HEARTS", "REALLY_REALLY", cards("HEART", "DIAMOND", "CLUB", "HEART"), bomb("BCX123", 0, 0, Map.of()), 4),
			bet(50, "FIVE_OF_DIAMONDS", "AWFUL_PLAY", cards("CLUB", "CLUB", "CLUB", "CLUB"), bomb("BCX123", 0, 0, Map.of(), PortType.PARALLEL), 1),
			bet(50, "KING_OF_HEARTS", "AWFUL_PLAY", cards("CLUB", "DIAMOND", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of("TRN", true)), 2),
			bet(50, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "DIAMOND", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 3),
			bet(50, "KING_OF_HEARTS", "AWFUL_PLAY", cards("CLUB", "DIAMOND", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(50, "KING_OF_HEARTS", "AWFUL_PLAY", cards("CLUB", "DIAMOND", "HEART", "HEART"), bomb("BCX999", 0, 0, Map.of()), 3),

			// $100
			bet(100, "KING_OF_HEARTS", "REALLY_REALLY", cards("CLUB", "HEART", "DIAMOND", "SPADE"), bomb("BCX123", 0, 1, Map.of()), 2),
			bet(100, "KING_OF_HEARTS", "REALLY", cards("CLUB", "HEART", "DIAMOND", "SPADE"), bomb("BCX123", 0, 1, Map.of()), 4),
			bet(100, "ACE_OF_SPADES", "TERRIBLE_PLAY", cards("CLUB", "HEART", "DIAMOND", "SPADE"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(100, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("HEART", "HEART", "HEART", "HEART"), bomb("ABC124", 0, 1, Map.of()), 4),
			bet(100, "KING_OF_HEARTS", "SURE_ABOUT_THAT", cards("CLUB", "HEART", "HEART", "SPADE"), bomb("BCX123", 0, 1, Map.of()), 3),
			bet(100, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("CLUB", "SPADE", "HEART", "HEART"), bomb("BCX123", 0, 1, Map.of()), 2),
			bet(100, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("HEART", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 1, Map.of("MSA", false)), 1),
			bet(100, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("DIAMOND", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 1, Map.of()), 3),
			bet(100, "KING_OF_HEARTS", "AWFUL_PLAY", cards("HEART", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 1, Map.of()), 4),
			bet(100, "KING_OF_HEARTS", "TERRIBLE_PLAY", cards("HEART", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 1, Map.of()), 2),

			// $500
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("CLUB", "CLUB", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of(), PortType.DVI), 3),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("SPADE", "HEART", "HEART", "HEART"), bomb("ABC123", 0, 0, Map.of(), PortType.DVI), 2),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("HEART", "DIAMOND", "DIAMOND", "DIAMOND"), bomb("BCX123", 0, 0, Map.of()), 1),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("SPADE", "SPADE", "SPADE", "SPADE"), bomb("BCX123", 0, 0, Map.of(), PortType.DVI), 4),
			bet(500, "KING_OF_HEARTS", "ARE_YOU_SURE", cards("DIAMOND", "HEART", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of("TRN", true), PortType.DVI), 4),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("HEART", "DIAMOND", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of(), PortType.DVI), 3),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("DIAMOND", "CLUB", "HEART", "HEART"), bomb("BCX123", 0, 0, Map.of("TRN", false), PortType.DVI), 2),
			bet(500, "KING_OF_HEARTS", "REALLY", cards("DIAMOND", "HEART", "HEART", "DIAMOND"), bomb("BCX123", 0, 0, Map.of("TRN", true), PortType.DVI), 1),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("DIAMOND", "HEART", "CLUB", "DIAMOND"), bomb("BCX123", 0, 2, Map.of("TRN", true), PortType.DVI), 3),
			bet(500, "KING_OF_HEARTS", "AWFUL_PLAY", cards("DIAMOND", "HEART", "CLUB", "DIAMOND"), bomb("BCX123", 0, 1, Map.of("TRN", true), PortType.DVI), 4)
		);
	}

	private static Arguments bet(
		int chip, String starter, String response, List<String> cards, BombEntity bomb, int expected
	) {
		return Arguments.of(chip, starter, response, cards, bomb, expected);
	}

	private static List<String> cards(String first, String second, String third, String fourth) {
		return List.of(first, second, third, fourth);
	}

	private static PokerInput input(
		int stage, String starter, String response, Integer chip, List<String> cards
	) {
		return new PokerInput(stage, starter, response, chip, cards);
	}

	private static BombEntity bomb(
		String serial, int aaBatteries, int dBatteries, Map<String, Boolean> indicators, PortType... ports
	) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aaBatteries);
		bomb.setDBatteryCount(dBatteries);
		bomb.setIndicators(new HashMap<>(indicators));
		if (ports.length > 0) {
			PortPlateEntity plate = new PortPlateEntity();
			plate.setPorts(new LinkedHashSet<>(List.of(ports)));
			bomb.setPortPlates(List.of(plate));
		}
		return bomb;
	}

	@SuppressWarnings("unchecked")
	private static PokerOutput success(SolveResult<PokerOutput> result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<PokerOutput>)result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.POKER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
