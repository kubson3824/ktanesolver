package ktanesolver.module.modded.regular.souvenir;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SouvenirSolverTest {
	private final SouvenirSolver solver = new SouvenirSolver();

	@Test
	void resolvesStageAndDerivedQuestionsAndKeepsQuestionHistory() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity memory = module(ModuleType.MEMORY, true, Map.of("displayHistory", List.of(4, 2, 3, 1, 4)));
		ModuleEntity bitmaps = module(ModuleType.BITMAPS, true, Map.of("whiteCounts", List.of(3, 7, 9, 12)));
		bomb.setModules(List.of(souvenir, memory, bitmaps));

		SouvenirOutput stage = solve(bomb, souvenir, memory.getId(),
			"What was the displayed number in the second stage of Memory?", List.of("1", "2", "3", "4"), false);
		assertThat(stage).isEqualTo(new SouvenirOutput("2", 2));
		assertThat(souvenir.isSolved()).isFalse();

		SouvenirOutput bitmap = solve(bomb, souvenir, bitmaps.getId(),
			"How many pixels were black in the bottom-right quadrant in Bitmaps?", List.of("3", "4", "7", "12"), true);
		assertThat(bitmap).isEqualTo(new SouvenirOutput("4", 2));
		assertThat(souvenir.isSolved()).isTrue();
		assertThat((List<?>) souvenir.getState().get("history")).hasSize(2);
	}

	@Test
	void rejectsUnsolvedSourcesAndAmbiguousAnswers() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity source = module(ModuleType.MEMORY, false, Map.of("displayHistory", List.of(1, 2)));
		bomb.setModules(List.of(souvenir, source));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(source.getId(), "What was displayed?", List.of("1", "2"), false)))
			.isInstanceOf(SolveFailure.class);
	}

	@Test
	void resolvesManualSpecificNegativeFrequencyAndGlyphFormats() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity morsematics = module(ModuleType.MORSEMATICS, true, Map.of("letters", "ABC"));
		ModuleEntity probing = module(ModuleType.PROBING, true, Map.of("missingFrequenciesByWire", List.of(10, 22, 50, 60, 22, 10)));
		ModuleEntity switches = module(ModuleType.SWITCHES, true, Map.of("currentSwitches", List.of(true, false, true, false, true)));
		ModuleEntity simon = module(ModuleType.SIMON_STATES, true, Map.of("flashHistory", List.of(List.of("RED"), List.of("RED", "GREEN"))));
		bomb.setModules(List.of(souvenir, morsematics, probing, switches, simon));

		assertThat(solve(bomb, souvenir, morsematics.getId(), "Which letter was not present in Morsematics?", List.of("A", "B", "C", "D"), false))
			.isEqualTo(new SouvenirOutput("D", 4));
		assertThat(solve(bomb, souvenir, probing.getId(), "What was the missing frequency in the yellow-red wire in Probing?", List.of("10Hz", "22Hz", "50Hz", "60Hz"), false))
			.isEqualTo(new SouvenirOutput("22Hz", 2));
		assertThat(solve(bomb, souvenir, switches.getId(), "What was the initial position of the switches in Switches?", List.of("QQQQQ", "QRQRQ", "RRRRR"), false))
			.isEqualTo(new SouvenirOutput("QRQRQ", 2));
		assertThat(solve(bomb, souvenir, simon.getId(), "Which colors didn't flash in the second stage in Simon States?", List.of("Red", "Yellow, Blue", "Green", "none"), false))
			.isEqualTo(new SouvenirOutput("Yellow, Blue", 2));
	}

	@Test
	void resolvesMazeCoordinatesAndSkewedSlotsLeadingZero() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maze = module(ModuleType.MAZES, true, Map.of(
			"input", Map.of("start", Map.of("row", 4, "col", 2))));
		ModuleEntity slots = module(ModuleType.SKEWED_SLOTS, true, Map.of("originalNumber", "027"));
		bomb.setModules(List.of(souvenir, maze, slots));

		assertThat(solve(bomb, souvenir, maze.getId(),
			"In which column was the starting position in Maze, counting from the left?",
			List.of("1", "2", "3", "4", "5", "6"), false))
			.isEqualTo(new SouvenirOutput("2", 2));
		assertThat(solve(bomb, souvenir, maze.getId(),
			"In which row was the starting position in Maze, counting from the top?",
			List.of("1", "2", "3", "4", "5", "6"), false))
			.isEqualTo(new SouvenirOutput("4", 4));
		assertThat(solve(bomb, souvenir, slots.getId(),
			"What were the original numbers in Skewed Slots?", List.of("027", "207", "270"), false))
			.isEqualTo(new SouvenirOutput("027", 1));
	}

	@Test
	void resolvesAudioAndSpriteAnswerFamilies() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity listening = module(ModuleType.LISTENING, true, Map.of("soundDescription", "Glass Shattering"));
		ModuleEntity fight = module(ModuleType.MONSPLODE_FIGHT, true, Map.of("input", Map.of(
			"opponent", "Docsplode", "moves", List.of("Boom", "Defuse", "Splash", "Tac"))));
		bomb.setModules(List.of(souvenir, listening, fight));

		assertThat(solve(bomb, souvenir, listening.getId(), "What sound was played in Listening?",
			List.of("Beach", "Glass Shattering", "Taxi Dispatch"), false))
			.isEqualTo(new SouvenirOutput("Glass Shattering", 2));
		assertThat(solve(bomb, souvenir, fight.getId(), "Which creature was displayed in Monsplode, Fight!?",
			List.of("Bob", "Docsplode", "Percy"), false))
			.isEqualTo(new SouvenirOutput("Docsplode", 2));
		assertThat(solve(bomb, souvenir, fight.getId(), "Which move was selectable in Monsplode, Fight!?",
			List.of("Appearify", "Defuse", "Finale"), false))
			.isEqualTo(new SouvenirOutput("Defuse", 2));
	}

	@Test
	void resolvesEverySimonScreamsQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity screams = module(ModuleType.SIMON_SCREAMS, true, Map.of(
			"flashHistory", List.of(
				List.of("ORANGE", "GREEN", "PURPLE"),
				List.of("ORANGE", "GREEN", "PURPLE", "RED"),
				List.of("ORANGE", "GREEN", "PURPLE", "RED", "YELLOW")),
			"ruleHistory", List.of(
				"at most one color flashed out of red, yellow, and blue",
				"at most one color flashed out of red, yellow, and blue",
				"two adjacent colors flashed in clockwise order")));
		bomb.setModules(List.of(souvenir, screams));

		assertThat(solve(bomb, souvenir, screams.getId(),
			"Which color flashed second in the final sequence in Simon Screams?",
			List.of("Red", "Orange", "Green", "Purple", "Yellow", "Blue"), false))
			.isEqualTo(new SouvenirOutput("Green", 3));
		assertThat(solve(bomb, souvenir, screams.getId(),
			"In which stage(s) of Simon Screams was “two adjacent colors flashed in clockwise order” the applicable rule?",
			List.of("first", "second", "third", "first and third"), false))
			.isEqualTo(new SouvenirOutput("third", 3));
		assertThat(solve(bomb, souvenir, screams.getId(),
			"In which stage(s) of Simon Screams was “at most one color flashed out of red, yellow, and blue” the applicable rule?",
			List.of("first", "second", "third", "first and second"), false))
			.isEqualTo(new SouvenirOutput("first and second", 4));
	}

	@SuppressWarnings("unchecked")
	private SouvenirOutput solve(BombEntity bomb, ModuleEntity souvenir, UUID sourceId, String question, List<String> answers, boolean last) {
		return ((SolveSuccess<SouvenirOutput>) solver.solve(
			new RoundEntity(), bomb, souvenir, new SouvenirInput(sourceId, question, answers, last))).output();
	}

	private static ModuleEntity module(ModuleType type, boolean solved, Map<String, Object> state) {
		ModuleEntity module = new ModuleEntity();
		module.setId(UUID.randomUUID());
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>(state));
		return module;
	}
}
