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
import ktanesolver.module.modded.regular.alphabet.AlphabetInput;
import ktanesolver.module.modded.regular.alphabet.AlphabetSolver;

class SouvenirSolverTest {
	private final SouvenirSolver solver = new SouvenirSolver();

	@Test
	void returnsEveryCubeRotationQuestion() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<String> rotations = List.of(
			"rotate clockwise", "tip left", "tip backwards",
			"rotate counterclockwise", "tip right", "tip forwards"
		);
		ModuleEntity cube = module(ModuleType.THE_CUBE, true, Map.of("rotations", rotations));
		bomb.setModules(List.of(souvenir, cube));

		String[] ordinals = {"first", "second", "third", "fourth", "fifth", "sixth"};
		for (int index = 0; index < ordinals.length; index++) {
			assertThat(solve(bomb, souvenir, cube.getId(), ordinals[index] + " rotation", List.of(), false).answer())
				.isEqualTo(rotations.get(index));
		}
	}

	@Test
	void returnsEveryJewelVaultWheelQuestion() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<String> wheelTurns = List.of("3", "4", "none", "1");
		ModuleEntity vault = module(ModuleType.JEWEL_VAULT, true, Map.of("wheelTurns", wheelTurns));
		bomb.setModules(List.of(souvenir, vault));

		for (int wheel = 1; wheel <= 4; wheel++) {
			assertThat(solve(bomb, souvenir, vault.getId(), "wheel " + wheel, List.of(), false).answer())
				.isEqualTo(wheelTurns.get(wheel - 1));
		}
		assertThat(solve(
			bomb, souvenir, vault.getId(),
			"Which wheel turned as a result of turning wheel 2 in The Jewel Vault?",
			List.of("1", "2", "3", "4", "none"), false
		)).isEqualTo(new SouvenirOutput("4", 4));
	}

	@Test
	void returnsEveryDrDoctorQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity doctor = module(ModuleType.DR_DOCTOR, true, Map.of(
			"listedDiseases", List.of("Alztimer’s", "Braintenance", "Color allergy"),
			"listedSymptoms", List.of("Fever", "Chills", "Dizziness", "Cough", "Gas", "Nausea", "Sleepiness"),
			"displayedSymptom", "Fever"
		));
		doctor.setSolution(new HashMap<>(Map.of("diagnosis", "Alztimer’s")));
		bomb.setModules(List.of(souvenir, doctor));

		assertThat(solve(bomb, souvenir, doctor.getId(), "diseases", List.of(), false))
			.isEqualTo(new SouvenirOutput("Braintenance, Color allergy", null));
		assertThat(solve(bomb, souvenir, doctor.getId(), "symptoms", List.of(), false))
			.isEqualTo(new SouvenirOutput("Chills, Dizziness, Cough, Gas, Nausea, Sleepiness", null));
		assertThat(solve(bomb, souvenir, doctor.getId(),
			"Which of these diseases was listed on Dr. Doctor, but not the one treated?",
			List.of("Alztimer’s", "Braintenance", "Detonession", "Emojilepsy"), false))
			.isEqualTo(new SouvenirOutput("Braintenance", 2));
		assertThat(solve(bomb, souvenir, doctor.getId(),
			"Which of these symptoms was listed on Dr. Doctor?",
			List.of("Fever", "Chills", "Cold Hands", "Numbness"), false))
			.isEqualTo(new SouvenirOutput("Chills", 2));
	}

	@Test
	void returnsEveryPlayfairCipherQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity playfair = module(ModuleType.PLAYFAIR_CIPHER, true,
			Map.of("encryptedMessage", "MRXRDM", "screenColor", "Magenta"));
		bomb.setModules(List.of(souvenir, playfair));

		String[] ordinals = {"first", "second", "third", "fourth", "fifth", "sixth"};
		for (int index = 0; index < ordinals.length; index++) {
			assertThat(solve(bomb, souvenir, playfair.getId(), ordinals[index] + " letter", List.of(), false).answer())
				.isEqualTo(String.valueOf("MRXRDM".charAt(index)));
		}
		assertThat(solve(bomb, souvenir, playfair.getId(), "screen color", List.of(), false).answer()).isEqualTo("Magenta");
	}

	@Test
	void returnsEveryLondonUndergroundJourneyStation() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity underground = module(ModuleType.LONDON_UNDERGROUND, true, Map.of(
			"departures", List.of("Oxford Circus", "Clapham South", "Walthamstow Central"),
			"destinations", List.of("Clapham South", "Walthamstow Central", "Stonebridge Park")
		));
		bomb.setModules(List.of(souvenir, underground));

		assertThat(solve(bomb, souvenir, underground.getId(), "first departure", List.of(), false).answer()).isEqualTo("Oxford Circus");
		assertThat(solve(bomb, souvenir, underground.getId(), "first arrival", List.of(), false).answer()).isEqualTo("Clapham South");
		assertThat(solve(bomb, souvenir, underground.getId(), "second departure", List.of(), false).answer()).isEqualTo("Clapham South");
		assertThat(solve(bomb, souvenir, underground.getId(), "second arrival", List.of(), false).answer()).isEqualTo("Walthamstow Central");
		assertThat(solve(bomb, souvenir, underground.getId(), "third departure", List.of(), false).answer()).isEqualTo("Walthamstow Central");
		assertThat(solve(bomb, souvenir, underground.getId(), "third arrival", List.of(), false).answer()).isEqualTo("Stonebridge Park");
	}

	@Test
	void returnsEverySkyrimQuestionFamilyAndMatchesDisplayedDragonLanguage() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity skyrim = module(ModuleType.SKYRIM, true, Map.of(
			"races", List.of("Nord", "Imperial", "Dunmer"), "correctRace", "Nord",
			"weapons", List.of("Mace of Molag Bal", "Firiniel’s End", "Volendrung"), "correctWeapon", "Mace of Molag Bal",
			"enemies", List.of("Frost Troll", "Mudcrab", "Dragon Priest"), "correctEnemy", "Frost Troll",
			"cities", List.of("Windhelm", "Winterhold", "Solitude"), "correctCity", "Windhelm",
			"dragonShouts", List.of("zun hal vik", "wuld nah kest", "tid klo ul"), "correctDragonShout", "zun hal vik"
		));
		bomb.setModules(List.of(souvenir, skyrim));

		assertThat(solve(bomb, souvenir, skyrim.getId(), "races", List.of(), false).answer()).isEqualTo("Imperial, Dunmer");
		assertThat(solve(bomb, souvenir, skyrim.getId(), "weapons", List.of(), false).answer()).isEqualTo("Firiniel’s End, Volendrung");
		assertThat(solve(bomb, souvenir, skyrim.getId(), "enemies", List.of(), false).answer()).isEqualTo("Mudcrab, Dragon Priest");
		assertThat(solve(bomb, souvenir, skyrim.getId(), "cities", List.of(), false).answer()).isEqualTo("Winterhold, Solitude");
		assertThat(solve(bomb, souvenir, skyrim.getId(), "dragonShouts", List.of(), false).answer()).isEqualTo("wuld nah kest, tid klo ul");
		assertThat(solve(bomb, souvenir, skyrim.getId(), "Which dragon shout was selectable, but not the solution, in Skyrim?",
			List.of("fus ro dah", "wuld nah kest", "jor zah frul", "yol tor shul"), false))
			.isEqualTo(new SouvenirOutput("wuld nah kest", 2));
	}

	@Test
	void returnsEveryHumanResourcesQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity humanResources = module(ModuleType.HUMAN_RESOURCES, true, Map.of(
			"redDescriptors", List.of("INTELLECTUAL", "DEVISER", "DIRECTOR"),
			"greenDescriptors", List.of("MANAGER", "SHOWMAN"),
			"employees", List.of("REBECCA", "DAMIAN", "ASHLEY", "SAMUEL", "QUINN"),
			"applicants", List.of("SILAS", "NOAH", "TIM", "DYLAN", "MIKE")
		));
		bomb.setModules(List.of(souvenir, humanResources));

		assertThat(solve(bomb, souvenir, humanResources.getId(), "redDescriptors", List.of(), false).answer())
			.isEqualTo("Intellectual, Deviser, Director");
		assertThat(solve(bomb, souvenir, humanResources.getId(), "greenDescriptors", List.of(), false).answer())
			.isEqualTo("Manager, Showman");
		assertThat(solve(bomb, souvenir, humanResources.getId(), "employees", List.of(), false).answer())
			.isEqualTo("Rebecca, Damian, Ashley, Samuel, Quinn");
		assertThat(solve(bomb, souvenir, humanResources.getId(), "applicants", List.of(), false).answer())
			.isEqualTo("Silas, Noah, Tim, Dylan, Mike");
	}

	@Test
	void returnsEveryIdentityParadeListedAndUnlistedTraitFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity parade = module(ModuleType.IDENTITY_PARADE, true, Map.of(
			"hairColors", List.of("BLACK", "BROWN", "RED"),
			"builds", List.of("HUNCHED", "SHORT", "TALL"),
			"attires", List.of("BLAZER", "SUIT", "T_SHIRT")
		));
		bomb.setModules(List.of(souvenir, parade));

		assertThat(solve(bomb, souvenir, parade.getId(), "hairColorsWas", List.of(), false).answer()).isEqualTo("Black, Brown, Red");
		assertThat(solve(bomb, souvenir, parade.getId(), "hairColorsWasNot", List.of(), false).answer()).isEqualTo("Blonde, Grey, White");
		assertThat(solve(bomb, souvenir, parade.getId(), "buildsWas", List.of(), false).answer()).isEqualTo("Hunched, Short, Tall");
		assertThat(solve(bomb, souvenir, parade.getId(), "buildsWasNot", List.of(), false).answer()).isEqualTo("Fat, Muscular, Slim");
		assertThat(solve(bomb, souvenir, parade.getId(), "attiresWas", List.of(), false).answer()).isEqualTo("Blazer, Suit, T-shirt");
		assertThat(solve(bomb, souvenir, parade.getId(), "attiresWasNot", List.of(), false).answer()).isEqualTo("Hoodie, Jumper, Tank top");
	}

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
		ModuleEntity coloredSwitches = module(ModuleType.COLORED_SWITCHES, true, Map.of(
			"initialPosition", List.of(true, true, false, false, true)));
		ModuleEntity simon = module(ModuleType.SIMON_STATES, true, Map.of("flashHistory", List.of(List.of("RED"), List.of("RED", "GREEN"))));
		bomb.setModules(List.of(souvenir, morsematics, probing, switches, coloredSwitches, simon));

		assertThat(solve(bomb, souvenir, morsematics.getId(), "Which letter was not present in Morsematics?", List.of("A", "B", "C", "D"), false))
			.isEqualTo(new SouvenirOutput("D", 4));
		assertThat(solve(bomb, souvenir, probing.getId(), "What was the missing frequency in the yellow-red wire in Probing?", List.of("10Hz", "22Hz", "50Hz", "60Hz"), false))
			.isEqualTo(new SouvenirOutput("22Hz", 2));
		assertThat(solve(bomb, souvenir, switches.getId(), "What was the initial position of the switches in Switches?", List.of("QQQQQ", "QRQRQ", "RRRRR"), false))
			.isEqualTo(new SouvenirOutput("QRQRQ", 2));

		assertThat(solve(bomb, souvenir, coloredSwitches.getId(), "initialPosition", List.of(), false))
			.isEqualTo(new SouvenirOutput("QQRRQ", null));
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
	void resolvesThreeDMazeMarkingsAndDirection() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maze = module(ModuleType.THREE_D_MAZE, true, Map.of(
			"markings", "A,B,C", "cardinalDirection", "North"));
		bomb.setModules(List.of(souvenir, maze));

		assertThat(solve(bomb, souvenir, maze.getId(), "What were the markings in 3D Maze?",
			List.of("ABD", "ABC", "ACH"), false)).isEqualTo(new SouvenirOutput("ABC", 2));
		assertThat(solve(bomb, souvenir, maze.getId(), "What was the cardinal direction in 3D Maze?",
			List.of("East", "South", "North", "West"), false)).isEqualTo(new SouvenirOutput("North", 3));
	}

	@Test
	void resolvesEveryMorseAMazeQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maze = module(ModuleType.MORSE_A_MAZE, true, Map.of(
			"startingLocation", "B3", "endingLocation", "F6", "morseWord", "assay"));
		bomb.setModules(List.of(souvenir, maze));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(maze.getId(), "startingCoordinate", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("B3", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(maze.getId(), "endingCoordinate", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("F6", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(maze.getId(), "morseCodeWord", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("assay", null), false));
	}

	@Test
	void returnsRecordedAnswerWithoutDisplayedChoices() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maze = module(ModuleType.THREE_D_MAZE, true, Map.of("markings", "A,B,C"));
		bomb.setModules(List.of(souvenir, maze));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(maze.getId(), "markings", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("ABC", null), false));
	}

	@Test
	void returnsTheRecordedFrequencyForTheNamedProbingWire() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity probing = module(ModuleType.PROBING, true,
			Map.of("missingFrequenciesByWire", List.of(50, 10, 60, 60, 22, 50)));
		bomb.setModules(List.of(souvenir, probing));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(probing.getId(), "yellow-black", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("10Hz", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(probing.getId(), "frequencies", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput(
				"red-white: 50Hz, yellow-black: 10Hz, green: 60Hz, gray: 60Hz, yellow-red: 22Hz, red-blue: 50Hz", null), false));
	}

	@Test
	void correctsTheUpsideDownThirdBaseDisplayForTheRequestedStage() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity thirdBase = module(ModuleType.THIRD_BASE, true,
			Map.of("displayHistory", List.of("XZNS", "ZHOX", "8I99")));
		bomb.setModules(List.of(souvenir, thirdBase));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(thirdBase.getId(), "firstDisplay", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("SNZX", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(thirdBase.getId(), "secondDisplay", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("XOHZ", null), false));
	}

	@Test
	void distinguishesTheMurderWeaponFromTheOtherPotentialWeapons() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity murder = module(ModuleType.MURDER, true, Map.of("input", Map.of(
			"suspects", List.of("MISS_SCARLETT", "PROFESSOR_PLUM", "MRS_PEACOCK", "REVEREND_GREEN"),
			"weapons", List.of("LEAD_PIPE", "REVOLVER", "SPANNER", "DAGGER"),
			"bodyLocation", "LIBRARY"
		)));
		murder.setSolution(Map.of("suspect", "MRS_PEACOCK", "weapon", "DAGGER", "location", "STUDY"));
		bomb.setModules(List.of(souvenir, murder));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(murder.getId(), "potentialWeaponNotMurderWeapon", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("LEAD PIPE, REVOLVER, SPANNER", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(murder.getId(), "notPotentialWeapon", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("CANDLESTICK, ROPE", null), false));
	}

	@Test
	void selectsADisplayedMafiaPlayerWhoWasNotTheGodfather() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity mafia = module(ModuleType.MAFIA, true, Map.of(
			"players", List.of("ROB", "TIM", "MARY", "BRIANE", "HUNTER", "MACY", "JOHN", "WILL"),
			"godfather", "MARY"));
		bomb.setModules(List.of(souvenir, mafia));

		assertThat(solve(bomb, souvenir, mafia.getId(), "Who was a player, but not the Godfather?",
			List.of("Mary", "Larry", "Kate", "John", "Diane", "Mac"), false))
			.isEqualTo(new SouvenirOutput("John", 4));
	}

	@Test
	void resolvesDisplayedChoicesForPreviouslyUnmappedModules() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity adventure = module(ModuleType.ADVENTURE_GAME, true,
			Map.of("input", Map.of("miscItems", List.of("Balloon", "Potion", "Ticket"))));
		ModuleEntity chess = module(ModuleType.CHESS, true,
			Map.of("coordinates", List.of("a1", "b2", "c3", "d4", "e5", "f6")));
		ModuleEntity coloredSquares = module(ModuleType.COLORED_SQUARES, true, Map.of("firstGroup", "MAGENTA"));
		ModuleEntity hexamaze = module(ModuleType.HEXAMAZE, true,
			Map.of("input", Map.of("pawnColor", "CYAN")));
		ModuleEntity orientationCube = module(ModuleType.ORIENTATION_CUBE, true, Map.of("initialFace", "LEFT"));
		bomb.setModules(List.of(souvenir, adventure, chess, coloredSquares, hexamaze, orientationCube));

		assertThat(solve(bomb, souvenir, adventure.getId(), "Which item was present in Adventure Game?",
			List.of("Balloon", "Bellows", "Moonstone", "Trophy"), false).answer()).isEqualTo("Balloon");
		assertThat(solve(bomb, souvenir, chess.getId(), "What was the third coordinate in Chess?",
			List.of("a4", "b5", "c3", "f2"), false).answer()).isEqualTo("c3");
		assertThat(solve(bomb, souvenir, coloredSquares.getId(), "What was the first color group in Colored Squares?",
			List.of("White", "Red", "Green", "Magenta"), false).answer()).isEqualTo("Magenta");
		assertThat(solve(bomb, souvenir, hexamaze.getId(), "What was the color of the pawn in Hexamaze?",
			List.of("Red", "Yellow", "Cyan", "Pink"), false).answer()).isEqualTo("Cyan");
		assertThat(solve(bomb, souvenir, orientationCube.getId(), "What was the observer's initial position in Orientation Cube?",
			List.of("front", "left", "back", "right"), false).answer()).isEqualTo("left");
	}

	@Test
	void resolvesDisplayedChoicesForIndexedAndExcludedAnswers() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity whosOnFirst = module(ModuleType.WHOS_ON_FIRST, true,
			Map.of("displayHistory", List.of("YES", "FIRST", "DISPLAY")));
		ModuleEntity morsematics = module(ModuleType.MORSEMATICS, true, Map.of("letters", List.of("A", "C", "F")));
		ModuleEntity murder = module(ModuleType.MURDER, true, Map.of("input", Map.of(
			"suspects", List.of("MISS_SCARLETT", "PROFESSOR_PLUM", "MRS_PEACOCK", "REVEREND_GREEN"),
			"weapons", List.of("LEAD_PIPE", "REVOLVER", "SPANNER", "DAGGER"), "bodyLocation", "LIBRARY")));
		murder.setSolution(Map.of("suspect", "MRS_PEACOCK", "weapon", "DAGGER", "location", "STUDY"));
		bomb.setModules(List.of(souvenir, whosOnFirst, morsematics, murder));

		assertThat(solve(bomb, souvenir, whosOnFirst.getId(), "What was the display in the first stage on Who's on First?",
			List.of("YES", "NO", "BLANK", "FIRST"), false).answer()).isEqualTo("YES");
		assertThat(solve(bomb, souvenir, morsematics.getId(), "Which of these letters was not present in Morsematics?",
			List.of("A", "C", "F", "Z"), false).answer()).isEqualTo("Z");
		assertThat(solve(bomb, souvenir, murder.getId(), "Which of these was a potential weapon but not the murder weapon in Murder?",
			List.of("Candlestick", "Rope", "Spanner", "Dagger"), false).answer()).isEqualTo("Spanner");
	}

	@Test
	void resolvesDisplayedChoicesForTheRemainingPreviouslyUntestedHandlers() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity button = module(ModuleType.BUTTON, true, Map.of("stripColor", "BLUE"));
		ModuleEntity colorFlash = module(ModuleType.COLOR_FLASH, true, Map.of("input", Map.of("sequence", List.of(
			Map.of("word", "RED", "color", "YELLOW"), Map.of("word", "GREEN", "color", "BLUE")))));
		ModuleEntity mysticSquare = module(ModuleType.MYSTIC_SQUARE, true,
			Map.of("input", Map.of("grid", List.of(1, 2, 3, 4, 8, 6, 7, 5, 9))));
		ModuleEntity perspectivePegs = module(ModuleType.PERSPECTIVE_PEGS, true,
			Map.of("initialSequence", List.of("RED", "GREEN", "BLUE", "YELLOW", "PURPLE")));
		ModuleEntity seaShells = module(ModuleType.SEA_SHELLS, true, Map.of("inputHistory", List.of(
			Map.of("row", "SHE SELLS", "column", "SEA SHELLS", "key", "ON THE SEA SHORE"),
			Map.of("row", "SEA SELLS", "column", "SHE SHELLS", "key", "ON THE SHE SURE"),
			Map.of("row", "SHE SHELLS", "column", "SHE SELLS", "key", "ON THE SEESAW"))));
		ModuleEntity shapeShift = module(ModuleType.SHAPE_SHIFT, true,
			Map.of("input", Map.of("left", "SQUARE", "right", "ROUND")));
		ModuleEntity bulb = module(ModuleType.THE_BULB, true, Map.of("initiallyOn", true));
		ModuleEntity wireSequence = module(ModuleType.WIRE_SEQUENCES, true, Map.of("red", 4, "blue", 3, "black", 2));
		bomb.setModules(List.of(souvenir, button, colorFlash, mysticSquare, perspectivePegs, seaShells, shapeShift, bulb, wireSequence));

		assertThat(solve(bomb, souvenir, button.getId(), "What color did the light glow in The Button?",
			List.of("Red", "Blue", "Yellow", "White"), false).answer()).isEqualTo("Blue");
		assertThat(solve(bomb, souvenir, colorFlash.getId(), "What was the color of the last word in the sequence in Colour Flash?",
			List.of("Red", "Yellow", "Green", "Blue"), false).answer()).isEqualTo("Blue");
		assertThat(solve(bomb, souvenir, mysticSquare.getId(), "What digit was initially in the center in Mystic Square?",
			List.of("2", "4", "8", "9"), false).answer()).isEqualTo("8");
		assertThat(solve(bomb, souvenir, perspectivePegs.getId(), "What was the third color in the initial sequence in Perspective Pegs?",
			List.of("Red", "Green", "Blue", "Yellow", "Purple", "Orange"), false).answer()).isEqualTo("Blue");
		assertThat(solve(bomb, souvenir, seaShells.getId(), "What were the third and fourth words in the second phrase in Sea Shells?",
			List.of("sea shells", "she shells", "sea sells", "she sells"), false).answer()).isEqualTo("she shells");
		assertThat(solve(bomb, souvenir, shapeShift.getId(), "What was the initial shape in Shape Shift?",
			List.of("A", "B", "C", "D"), false).answer()).isEqualTo("B");
		assertThat(solve(bomb, souvenir, bulb.getId(), "Was the bulb initially lit in The Bulb?",
			List.of("Yes", "No"), false).answer()).isEqualTo("Yes");
		assertThat(solve(bomb, souvenir, wireSequence.getId(), "How many red wires were there in Wire Sequence?",
			List.of("1", "2", "3", "4", "5", "6"), false).answer()).isEqualTo("4");
	}

	@Test
	void resolvesAnExactQuestionForAnUnmappedModuleInsteadOfDumpingItsState() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity mouse = module(ModuleType.MOUSE_IN_THE_MAZE, true, Map.of("input", Map.of(
			"torusColor", "YELLOW",
			"stepsToWall", List.of(0, 2, 2, 0),
			"startDirection", "UP",
			"sphereColorAtPosition", "WHITE"
		)));
		bomb.setModules(List.of(souvenir, mouse));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir, new SouvenirInput(
			mouse.getId(), "torusColor", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("YELLOW", null), false));
	}

	@Test
	void resolvesAnOrdinalInsideARecordedListOfObjects() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity microcontroller = module(ModuleType.MICROCONTROLLER, true, Map.of());
		microcontroller.setSolution(Map.of("pins", List.of(
			Map.of("color", "RED"), Map.of("color", "GREEN"), Map.of("color", "BLUE")
		)));
		bomb.setModules(List.of(souvenir, microcontroller));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir, new SouvenirInput(
			microcontroller.getId(), "What color was the second pin in Microcontroller?", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("GREEN", null), false));
	}

	@Test
	void resolvesInputAutomaticallyRecordedByAnOtherwiseStatelessSolver() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity alphabet = module(ModuleType.ALPHABET, false, Map.of());
		bomb.setModules(List.of(souvenir, alphabet));
		new AlphabetSolver().solve(new RoundEntity(), bomb, alphabet,
			new AlphabetInput(List.of("A", "R", "G", "F")));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir, new SouvenirInput(
			alphabet.getId(), "What letters were shown in Alphabet?", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput("A, R, G, F", null), false));
	}

	@Test
	void labelsSpatialRecordedAnswers() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity bitmaps = module(ModuleType.BITMAPS, true, Map.of("whiteCounts", List.of(3, 7, 9, 12)));
		ModuleEntity fizzBuzz = module(ModuleType.FIZZ_BUZZ, true,
			Map.of("displayedNumbers", List.of("1234567", "7654321", "9081726")));
		ModuleEntity onlyConnect = module(ModuleType.ONLY_CONNECT, true,
			Map.of("hieroglyphs", List.of("Lion", "Water", "Eye", "Reeds", "Viper", "Flax")));
		ModuleEntity ticTacToe = module(ModuleType.TIC_TAC_TOE, true,
			Map.of("initialBoard", List.of("1", "X", "3", "O", "5", "6", "7", "8", "9")));
		bomb.setModules(List.of(souvenir, bitmaps, fizzBuzz, onlyConnect, ticTacToe));

		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(bitmaps.getId(), "whitePixels", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput(
				"top left: 3, top right: 7, bottom left: 9, bottom right: 12", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(fizzBuzz.getId(), "displayedNumbers", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput(
				"top: 1234567, middle: 7654321, bottom: 9081726", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(onlyConnect.getId(), "hieroglyphs", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput(
				"top left: Lion, top middle: Water, top right: Eye, bottom left: Reeds, bottom middle: Viper, bottom right: Flax", null), false));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(ticTacToe.getId(), "initialField", null, false)))
			.isEqualTo(new SolveSuccess<>(new SouvenirOutput(
				"top left: 1, top middle: X, top right: 3, middle left: O, middle center: 5, middle right: 6, bottom left: 7, bottom middle: 8, bottom right: 9", null), false));
	}

	@Test
	void resolvesEachGamepadDisplayDigit() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity gamepad = module(ModuleType.GAMEPAD, true, Map.of("input", Map.of("x", 7, "y", 42)));
		bomb.setModules(List.of(souvenir, gamepad));
		List<String> answers = List.of("2", "0", "7", "4");

		assertThat(solve(bomb, souvenir, gamepad.getId(), "What was the first digit on the display on The Gamepad?", answers, false))
			.isEqualTo(new SouvenirOutput("0", 2));
		assertThat(solve(bomb, souvenir, gamepad.getId(), "What was the second digit on the display on The Gamepad?", answers, false))
			.isEqualTo(new SouvenirOutput("7", 3));
		assertThat(solve(bomb, souvenir, gamepad.getId(), "What was the third digit on the display on The Gamepad?", answers, false))
			.isEqualTo(new SouvenirOutput("4", 4));
		assertThat(solve(bomb, souvenir, gamepad.getId(), "What was the fourth digit on the display on The Gamepad?", answers, false))
			.isEqualTo(new SouvenirOutput("2", 1));
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
	void resolvesEveryMonsplodeTradingCardsQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity cards = module(ModuleType.MONSPLODE_TRADING_CARDS, true, Map.of(
			"souvenirCardNames", List.of("Aluga", "Bob", "Buhar"),
			"souvenirPrintVersions", List.of("A2", "C4", "I8")
		));
		bomb.setModules(List.of(souvenir, cards));

		assertThat(solve(bomb, souvenir, cards.getId(), "cardNames", List.of(), false))
			.isEqualTo(new SouvenirOutput("Aluga, Bob, Buhar", null));
		assertThat(solve(bomb, souvenir, cards.getId(), "printVersions", List.of(), false))
			.isEqualTo(new SouvenirOutput("A2, C4, I8", null));
		assertThat(solve(bomb, souvenir, cards.getId(),
			"Which of these cards was in your hand before the last action in Monsplode Trading Cards?",
			List.of("Asteran", "Bob", "Docsplode", "Percy"), false)).isEqualTo(new SouvenirOutput("Bob", 2));
		assertThat(solve(bomb, souvenir, cards.getId(),
			"Which of these print versions was present on a card in your hand before the last action in Monsplode Trading Cards?",
			List.of("A1", "B7", "C4", "H2", "I9", "G5"), false)).isEqualTo(new SouvenirOutput("C4", 3));
	}

	@Test
	void resolvesTextFieldDisplayedLetter() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity textField = module(ModuleType.TEXT_FIELD, true, Map.of("displayedLetter", "E"));
		bomb.setModules(List.of(souvenir, textField));

		assertThat(solve(bomb, souvenir, textField.getId(), "What was the displayed letter in Text Field?",
			List.of("A", "B", "C", "D", "E", "F"), false))
			.isEqualTo(new SouvenirOutput("E", 5));
	}

	@Test
	void resolvesCheapCheckoutSingleAndTwoPaymentQuestions() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity onePayment = module(ModuleType.CHEAP_CHECKOUT, true, Map.of("paidAmounts", List.of("$24.00")));
		ModuleEntity twoPayments = module(ModuleType.CHEAP_CHECKOUT, true, Map.of("paidAmounts", List.of("$10.00", "$25.00")));
		bomb.setModules(List.of(souvenir, onePayment, twoPayments));

		assertThat(solve(bomb, souvenir, onePayment.getId(), "What was the paid amount in Cheap Checkout?",
			List.of("$20.00", "$24.00", "$25.00"), false)).isEqualTo(new SouvenirOutput("$24.00", 2));
		assertThat(solve(bomb, souvenir, twoPayments.getId(), "What was the first paid amount in Cheap Checkout?",
			List.of("$10.00", "$20.00", "$25.00"), false)).isEqualTo(new SouvenirOutput("$10.00", 1));
		assertThat(solve(bomb, souvenir, twoPayments.getId(), "What was the second paid amount in Cheap Checkout?",
			List.of("$10.00", "$20.00", "$25.00"), false)).isEqualTo(new SouvenirOutput("$25.00", 3));
	}

	@Test
	void resolvesCoordinatesGridSizeInItsOriginalNotation() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity coordinates = module(ModuleType.COORDINATES, true, Map.of("gridSizeClue", "4×7"));
		bomb.setModules(List.of(souvenir, coordinates));

		assertThat(solve(bomb, souvenir, coordinates.getId(), "What was the grid size in Coordinates?",
			List.of("4×6", "4×7", "5×7"), false)).isEqualTo(new SouvenirOutput("4×7", 2));
	}

	@Test
	void resolvesEveryBraillePositionAsAVisualPattern() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity braille = module(ModuleType.BRAILLE, true, Map.of("braillePatterns", List.of(1, 10, 21, 63)));
		bomb.setModules(List.of(souvenir, braille));

		assertThat(solve(bomb, souvenir, braille.getId(), "first pattern", List.of(), false))
			.isEqualTo(new SouvenirOutput("⠁ (dots 1)", null));
		assertThat(solve(bomb, souvenir, braille.getId(), "second pattern", List.of(), false))
			.isEqualTo(new SouvenirOutput("⠊ (dots 2, 4)", null));
		assertThat(solve(bomb, souvenir, braille.getId(), "third pattern", List.of(), false))
			.isEqualTo(new SouvenirOutput("⠕ (dots 1, 3, 5)", null));
		assertThat(solve(bomb, souvenir, braille.getId(), "fourth pattern", List.of(), false))
			.isEqualTo(new SouvenirOutput("⠿ (dots 1, 2, 3, 4, 5, 6)", null));
		assertThat(solve(bomb, souvenir, braille.getId(), "What was the second pattern in Braille?",
			List.of("dots 1 3", "⠊", "dots 1 2 3"), false)).isEqualTo(new SouvenirOutput("⠊", 2));
	}

	@Test
	void resolvesEveryFlagsQuestionFamilyWithoutReturningAnAmbiguousFlagList() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity flags = module(ModuleType.FLAGS, true, Map.of(
			"displayedNumber", 4,
			"mainCountry", "Canada",
			"countries", List.of("France", "Japan", "India", "Chile", "Norway", "Sweden", "Germany")
		));
		bomb.setModules(List.of(souvenir, flags));

		assertThat(solve(bomb, souvenir, flags.getId(), "displayedNumber", List.of(), false))
			.isEqualTo(new SouvenirOutput("4", null));
		assertThat(solve(bomb, souvenir, flags.getId(), "mainCountry", List.of(), false))
			.isEqualTo(new SouvenirOutput("Canada", null));
		assertThat(solve(bomb, souvenir, flags.getId(),
			"Which of these country flags was shown, but not the main country flag, in Flags?",
			List.of("Brazil", "Japan", "China", "Poland", "Mexico", "Samoa"), false))
			.isEqualTo(new SouvenirOutput("Japan", 2));

		flags.getState().put("unicornRule", true);
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(flags.getId(), "displayedNumber", List.of(), false)))
			.isInstanceOf(SolveFailure.class);
	}

	@Test
	void resolvesBothTimezoneCityQuestions() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity timezone = module(ModuleType.TIMEZONE, true, Map.of(
			"input", Map.of("departureCity", "Buenos Aires", "destinationCity", "Tarawa")
		));
		bomb.setModules(List.of(souvenir, timezone));

		assertThat(solve(bomb, souvenir, timezone.getId(), "departureCity", List.of(), false))
			.isEqualTo(new SouvenirOutput("Buenos Aires", null));
		assertThat(solve(bomb, souvenir, timezone.getId(), "destinationCity", List.of(), false))
			.isEqualTo(new SouvenirOutput("Tarawa", null));
		assertThat(solve(bomb, souvenir, timezone.getId(), "What was the departure city in Timezone?",
			List.of("Alofi", "Buenos Aires", "Edinburgh", "Tokyo"), false))
			.isEqualTo(new SouvenirOutput("Buenos Aires", 2));
		assertThat(solve(bomb, souvenir, timezone.getId(), "What was the destination city in Timezone?",
			List.of("Berlin", "Moscow", "Sydney", "Tarawa"), false))
			.isEqualTo(new SouvenirOutput("Tarawa", 4));
	}

	@Test
	void resolvesChordQualitiesGivenNoteMembership() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity chordQualities = module(ModuleType.CHORD_QUALITIES, true,
			Map.of("givenNotes", List.of("A♯", "C", "D♯", "E")));
		bomb.setModules(List.of(souvenir, chordQualities));

		assertThat(solve(bomb, souvenir, chordQualities.getId(),
			"Which note was part of the given chord in Chord Qualities?",
			List.of("A", "A♯", "B", "C♯", "D", "F"), false))
			.isEqualTo(new SouvenirOutput("A♯", 2));
	}

	@Test
	void resolvesCreationsFirstWeatherFromTheSuccessfulRun() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity creation = module(ModuleType.CREATION, true, Map.of("firstWeather", "Meteor Shower"));
		bomb.setModules(List.of(souvenir, creation));

		assertThat(solve(bomb, souvenir, creation.getId(),
			"What were the weather conditions on the first day in Creation?",
			List.of("Clear", "Heat Wave", "Meteor Shower", "Rain", "Windy"), false))
			.isEqualTo(new SouvenirOutput("Meteor Shower", 3));
	}

	@Test
	void resolvesEveryIceCreamQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity iceCream = module(ModuleType.ICE_CREAM, true, Map.of("stages", List.of(Map.of(
			"customer", "Mike",
			"offeredFlavors", List.of("Tutti Frutti", "Rocky Road", "Cookies & Cream", "The Classic", "Vanilla"),
			"soldFlavor", "Cookies & Cream"
		))));
		bomb.setModules(List.of(souvenir, iceCream));

		assertThat(solve(bomb, souvenir, iceCream.getId(), "Who was the first customer in Ice Cream?",
			List.of("Tim", "Mike", "Tom", "Dave", "Adam", "Cheryl"), false))
			.isEqualTo(new SouvenirOutput("Mike", 2));
		assertThat(solve(bomb, souvenir, iceCream.getId(), "Which one of these flavours was on offer, but not sold, to the first customer in Ice Cream?",
			List.of("Double Chocolate", "Tutti Frutti", "Cookies & Cream", "Mint Chocolate Chip"), false))
			.isEqualTo(new SouvenirOutput("Tutti Frutti", 2));
		assertThat(solve(bomb, souvenir, iceCream.getId(), "Which one of these flavours was not on offer to the first customer in Ice Cream?",
			List.of("Rocky Road", "Vanilla", "Raspberry Ripple", "The Classic"), false))
			.isEqualTo(new SouvenirOutput("Raspberry Ripple", 3));
	}

	@Test
	void resolvesYahtzeesInitialRollCategory() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity yahtzee = module(ModuleType.YAHTZEE, true, Map.of("initialRollCategory", "full house"));
		bomb.setModules(List.of(souvenir, yahtzee));

		assertThat(solve(bomb, souvenir, yahtzee.getId(), "What was the initial roll on Yahtzee?",
			List.of("large straight", "small straight", "four of a kind", "full house"), false))
			.isEqualTo(new SouvenirOutput("full house", 4));
	}

	@Test
	void resolvesEachSuccessfulVisualImpairmentStageColor() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity visualImpairment = module(ModuleType.VISUAL_IMPAIRMENT, true, Map.of(
			"desiredColors", List.of("Blue", "White", "Red")
		));
		bomb.setModules(List.of(souvenir, visualImpairment));

		assertThat(solve(bomb, souvenir, visualImpairment.getId(), "second desired color", List.of(), false))
			.isEqualTo(new SouvenirOutput("White", null));
		assertThat(solve(bomb, souvenir, visualImpairment.getId(),
			"What was the desired color in the third stage on Visual Impairment?",
			List.of("Blue", "Green", "Red", "White"), false))
			.isEqualTo(new SouvenirOutput("Red", 3));
	}

	@Test
	void resolvesXRayScannedSymbolSprites() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity xRay = module(ModuleType.X_RAY, true, Map.of(
			"scannedSymbols", List.of("a1 flipped", "h6", "f10")
		));
		bomb.setModules(List.of(souvenir, xRay));

		assertThat(solve(bomb, souvenir, xRay.getId(), "Which symbol was scanned in X-Ray?",
			List.of("a1", "e2", "a1 flipped", "b10", "i9", "d1"), false))
			.isEqualTo(new SouvenirOutput("a1 flipped", 3));
		assertThat(solve(bomb, souvenir, xRay.getId(), "symbols", List.of(), false))
			.isEqualTo(new SouvenirOutput("a1 flipped, h6, f10", null));
	}

	@Test
	void resolvesBothGridlockQuestionFamilies() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity gridlock = module(ModuleType.GRIDLOCK, true, Map.of(
			"startingColor", "Blue", "startingLocation", "C4"
		));
		bomb.setModules(List.of(souvenir, gridlock));

		assertThat(solve(bomb, souvenir, gridlock.getId(), "startingColor", List.of(), false))
			.isEqualTo(new SouvenirOutput("Blue", null));
		assertThat(solve(bomb, souvenir, gridlock.getId(), "startingLocation", List.of(), false))
			.isEqualTo(new SouvenirOutput("C4", null));
	}

	@Test
	void resolvesBlindMazeButtonColorsAtEveryPosition() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity blindMaze = module(ModuleType.BLIND_MAZE, true, Map.of("buttonColors", Map.of(
			"north", "Red", "east", "Green", "south", "Blue", "west", "Yellow"
		)));
		bomb.setModules(List.of(souvenir, blindMaze));

		assertThat(solve(bomb, souvenir, blindMaze.getId(), "northButtonColor", List.of(), false))
			.isEqualTo(new SouvenirOutput("Red", null));
		assertThat(solve(bomb, souvenir, blindMaze.getId(), "eastButtonColor", List.of(), false))
			.isEqualTo(new SouvenirOutput("Green", null));
		assertThat(solve(bomb, souvenir, blindMaze.getId(), "southButtonColor", List.of(), false))
			.isEqualTo(new SouvenirOutput("Blue", null));
		assertThat(solve(bomb, souvenir, blindMaze.getId(), "westButtonColor", List.of(), false))
			.isEqualTo(new SouvenirOutput("Yellow", null));
		assertThat(solve(bomb, souvenir, blindMaze.getId(),
			"What color was the south button in Blind Maze?", List.of("Red", "Green", "Blue", "Gray", "Yellow"), false))
			.isEqualTo(new SouvenirOutput("Blue", 3));
	}

	@Test
	void resolvesGameOfLifeCruelColorCombinations() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity gameOfLife = module(ModuleType.GAME_OF_LIFE_CRUEL, true, Map.of(
			"colorCombinations", List.of("Solid Red", "Black/Orange", "Blue/Purple")
		));
		bomb.setModules(List.of(souvenir, gameOfLife));

		assertThat(solve(bomb, souvenir, gameOfLife.getId(), "colorCombinations", List.of(), false))
			.isEqualTo(new SouvenirOutput("Solid Red, Black/Orange, Blue/Purple", null));
		assertThat(solve(bomb, souvenir, gameOfLife.getId(),
			"Which of these was a color combination that occurred in Game of Life Cruel?",
			List.of("Solid Green", "Black/Orange", "Red/Blue", "Solid Brown"), false))
			.isEqualTo(new SouvenirOutput("Black/Orange", 2));
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

	@Test
	void resolvesEveryForgetEverythingStageOneDigit() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity forgetEverything = module(ModuleType.FORGET_EVERYTHING, true, Map.of(
			"firstStageDigits", List.of(9, 8, 7, 6, 5, 4, 3, 2, 1, 0)));
		bomb.setModules(List.of(souvenir, forgetEverything));
		String[] ordinals = {"first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"};

		for (int index = 0; index < ordinals.length; index++) {
			assertThat(solve(bomb, souvenir, forgetEverything.getId(),
				"What was the " + ordinals[index] + " displayed digit in the first stage of Forget Everything?",
				List.of(), false)).isEqualTo(new SouvenirOutput(String.valueOf(9 - index), null));
		}
	}

	@Test
	void resolvesForgetMeNotSimonSaysTwoBitsAndAnotherSouvenir() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity forgetMeNot = module(ModuleType.FORGET_ME_NOT, true, Map.of(
			"displayNumbers", List.of(7, 2), "calculatedNumbers", List.of(1, 4)));
		ModuleEntity simonSays = module(ModuleType.SIMON_SAYS, true, Map.of(
			"input", Map.of("flashes", List.of("RED", "BLUE"))));
		ModuleEntity twoBits = module(ModuleType.TWO_BITS, true, Map.of("stages", List.of(
			Map.of("number", 5, "letters", "kp"),
			Map.of("number", 7, "letters", "vt"),
			Map.of("number", 3, "letters", "tk"),
			Map.of("number", 9, "letters", "dt"))));
		ModuleEntity otherSouvenir = module(ModuleType.SOUVENIR, true, Map.of("history", List.of(Map.of(
			"sourceModuleType", "FORGET_ME_NOT",
			"question", "What was the digit displayed in the first stage of Forget Me Not?"))));
		bomb.setModules(List.of(souvenir, forgetMeNot, simonSays, twoBits, otherSouvenir));

		assertThat(solve(bomb, souvenir, forgetMeNot.getId(),
			"What was the digit displayed in the second stage of Forget Me Not?",
			List.of("1", "2", "4", "7"), false)).isEqualTo(new SouvenirOutput("2", 2));
		assertThat(solve(bomb, souvenir, simonSays.getId(),
			"What color flashed second in the final sequence in Simon Says?",
			List.of("Red", "Blue", "Green", "Yellow"), false)).isEqualTo(new SouvenirOutput("Blue", 2));
		assertThat(solve(bomb, souvenir, twoBits.getId(),
			"What was the third correct query response from Two Bits?",
			List.of("03", "07", "09"), false)).isEqualTo(new SouvenirOutput("09", 3));
		assertThat(solve(bomb, souvenir, otherSouvenir.getId(),
			"What was the first module asked about in the other Souvenir on this bomb?",
			List.of("Forget Me Not", "Simon Says", "Two Bits"), false))
			.isEqualTo(new SouvenirOutput("Forget Me Not", 1));
	}

	@Test
	void resolvesRhythmsFinalSuccessfulColor() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity rhythms = module(ModuleType.RHYTHMS, true, Map.of("lastSuccessfulColor", "GREEN"));
		bomb.setModules(List.of(souvenir, rhythms));

		assertThat(solve(bomb, souvenir, rhythms.getId(), "What was the color in Rhythms?",
			List.of("Blue", "Red", "Green", "Yellow"), false))
			.isEqualTo(new SouvenirOutput("Green", 3));
	}

	@Test
	void resolvesOnlyConnectHieroglyphSpritesByTheirCanonicalNames() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity onlyConnect = module(ModuleType.ONLY_CONNECT, true, Map.of("hieroglyphs", List.of(
			"Lion", "Water", "Eye of Horus", "Two Reeds", "Horned Viper", "Twisted Flax"
		)));
		bomb.setModules(List.of(souvenir, onlyConnect));

		assertThat(solve(bomb, souvenir, onlyConnect.getId(),
			"Which Egyptian hieroglyph was in the top right in Only Connect?",
			List.of("Two Reeds", "Lion", "Eye of Horus", "Water", "Horned Viper", "Twisted Flax"), false))
			.isEqualTo(new SouvenirOutput("Eye of Horus", 3));
	}

	@Test
	void resolvesBothNeutralizationQuestionFamilies() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity neutralization = module(ModuleType.NEUTRALIZATION, true, Map.of(
			"acidColor", "RED", "acidVolume", 15
		));
		bomb.setModules(List.of(souvenir, neutralization));

		assertThat(solve(bomb, souvenir, neutralization.getId(), "What was the acid's color in Neutralization?",
			List.of("Yellow", "Green", "Red", "Blue"), false)).isEqualTo(new SouvenirOutput("Red", 3));
		assertThat(solve(bomb, souvenir, neutralization.getId(), "What was the acid's volume in Neutralization?",
			List.of("5", "10", "15", "20"), true)).isEqualTo(new SouvenirOutput("15", 3));
	}

	@Test
	void resolvesFizzBuzzDigitsOnlyForChangedDisplays() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity fizzBuzz = module(ModuleType.FIZZ_BUZZ, true, Map.of(
			"displayedNumbers", List.of("1234567", "7654321", "9081726"),
			"actions", List.of("FIZZ", "NUMBER", "BUZZ")
		));
		bomb.setModules(List.of(souvenir, fizzBuzz));

		assertThat(solve(bomb, souvenir, fizzBuzz.getId(),
			"What was the first digit on the top display of FizzBuzz?",
			List.of("0", "1", "2", "3", "4", "5"), false)).isEqualTo(new SouvenirOutput("1", 2));
		assertThat(solve(bomb, souvenir, fizzBuzz.getId(),
			"What was the sixth digit on the bottom display of FizzBuzz?",
			List.of("0", "1", "2", "3", "4", "5"), false)).isEqualTo(new SouvenirOutput("2", 3));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir, new SouvenirInput(
			fizzBuzz.getId(), "What was the first digit on the middle display of FizzBuzz?",
			List.of("0", "1", "2", "3", "4", "5"), false))).isInstanceOf(SolveFailure.class);
	}

	@Test
	void resolvesLedEncryptionLettersForEachNonFinalStage() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity ledEncryption = module(ModuleType.LED_ENCRYPTION, true, Map.of(
			"totalStages", 3,
			"stageLetters", List.of(
				List.of("B", "D", "G", "C"),
				List.of("A", "F", "Q", "K"),
				List.of("H", "L", "P", "T")
			)
		));
		bomb.setModules(List.of(souvenir, ledEncryption));

		assertThat(solve(bomb, souvenir, ledEncryption.getId(),
			"Which of these letters was present in the first stage of LED Encryption?",
			List.of("B", "E", "H", "M", "R", "Z"), false)).isEqualTo(new SouvenirOutput("B", 1));
		assertThat(solve(bomb, souvenir, ledEncryption.getId(),
			"Which of these letters was present in the second stage of LED Encryption?",
			List.of("B", "F", "H", "M", "R", "Z"), false)).isEqualTo(new SouvenirOutput("F", 2));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir, new SouvenirInput(
			ledEncryption.getId(), "Which of these letters was present in the third stage of LED Encryption?",
			List.of("A", "H", "M", "Q", "V", "Z"), false))).isInstanceOf(SolveFailure.class);
	}

	@Test
	void resolvesEveryLogicalButtonsQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity logicalButtons = module(ModuleType.LOGICAL_BUTTONS, true, Map.of("stages", List.of(
			Map.of("operator", "AND", "buttons", List.of(
				Map.of("color", "Red", "label", "Logic"),
				Map.of("color", "Blue", "label", "Color"),
				Map.of("color", "Green", "label", "Label"))),
			Map.of("operator", "NOR", "buttons", List.of(
				Map.of("color", "White", "label", "Button"),
				Map.of("color", "Orange", "label", "Wrong"),
				Map.of("color", "Cyan", "label", "Boom"))),
			Map.of("operator", "XNOR", "buttons", List.of(
				Map.of("color", "Grey", "label", "No"),
				Map.of("color", "Purple", "label", "Wait"),
				Map.of("color", "Yellow", "label", "Hmmm")))
		)));
		bomb.setModules(List.of(souvenir, logicalButtons));

		assertThat(solve(bomb, souvenir, logicalButtons.getId(), "color top first", List.of(), false).answer()).isEqualTo("Red");
		assertThat(solve(bomb, souvenir, logicalButtons.getId(), "label bottom-left second", List.of(), false).answer()).isEqualTo("Wrong");
		assertThat(solve(bomb, souvenir, logicalButtons.getId(), "operator third", List.of(), false).answer()).isEqualTo("XNOR");
	}

	@Test
	void resolvesEverySimonSingsQuestionFamilyThroughTheDirectAnswerPath() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity simonSings = module(ModuleType.SIMON_SINGS, true, Map.of("flashHistory", List.of(
			List.of("D", "C", "C♯", "D♯", "E", "G", "G♯", "B"),
			List.of("F♯", "A", "A♯", "G♯", "D", "C", "B", "E"),
			List.of("F", "G", "A", "G♯", "A♯", "E", "B", "C♯")
		)));
		bomb.setModules(List.of(souvenir, simonSings));

		assertThat(solve(bomb, souvenir, simonSings.getId(), "flash eighth third", List.of(), false).answer())
			.isEqualTo("C♯");
	}

	@Test
	void resolvesEverySimonSendsReceivedLetterThroughTheDirectAnswerPath() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity simonSends = module(ModuleType.SIMON_SENDS, true, Map.of(
			"receivedLetters", Map.of("red", "A", "green", "B", "blue", "C")));
		bomb.setModules(List.of(souvenir, simonSends));

		assertThat(solve(bomb, souvenir, simonSends.getId(), "red received letter", List.of(), false).answer()).isEqualTo("A");
		assertThat(solve(bomb, souvenir, simonSends.getId(), "green received letter", List.of(), false).answer()).isEqualTo("B");
		assertThat(solve(bomb, souvenir, simonSends.getId(), "blue received letter", List.of(), false).answer()).isEqualTo("C");
	}

	@Test
	void resolvesAllFiveSimonsStarFlashColorsThroughDirectAndDisplayedAnswers() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<String> flashes = List.of("RED", "BLUE", "RED", "YELLOW", "PURPLE");
		ModuleEntity simonsStar = module(ModuleType.SIMONS_STAR, true, Map.of("flashes", flashes));
		bomb.setModules(List.of(souvenir, simonsStar));

		List<String> ordinals = List.of("first", "second", "third", "fourth", "fifth");
		for (int index = 0; index < ordinals.size(); index++) {
			assertThat(solve(bomb, souvenir, simonsStar.getId(), "flash " + ordinals.get(index), List.of(), false).answer())
				.isEqualTo(flashes.get(index));
		}
		assertThat(solve(bomb, souvenir, simonsStar.getId(),
			"Which color flashed fifth in Simon's Star?",
			List.of("Red", "Yellow", "Green", "Blue", "Purple"), false))
			.isEqualTo(new SouvenirOutput("Purple", 5));
	}

	@Test
	void resolvesEverySimonShrieksFinalFlashThroughTheDirectAndDisplayedAnswerPaths() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<Integer> flashes = List.of(0, 6, 1, 4, 2, 5, 3, 0);
		ModuleEntity simonShrieks = module(ModuleType.SIMON_SHRIEKS, true, Map.of("flashes", flashes));
		bomb.setModules(List.of(souvenir, simonShrieks));

		List<String> ordinals = List.of("first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth");
		for (int i = 0; i < ordinals.size(); i++) {
			assertThat(solve(bomb, souvenir, simonShrieks.getId(), "flash " + ordinals.get(i), List.of(), false).answer())
				.isEqualTo(flashes.get(i).toString());
		}
		assertThat(solve(bomb, souvenir, simonShrieks.getId(),
			"How many spaces clockwise from the arrow was the fifth flash in the final sequence in Simon Shrieks?",
			List.of("0", "1", "2", "3", "4", "5"), false)).isEqualTo(new SouvenirOutput("2", 3));
	}

	@Test
	void resolvesTheCodeDisplayedNumber() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity theCode = module(ModuleType.THE_CODE, true, Map.of("displayedNumber", 4321));
		bomb.setModules(List.of(souvenir, theCode));

		assertThat(solve(bomb, souvenir, theCode.getId(), "displayedNumber", List.of(), false).answer())
			.isEqualTo("4321");
	}

	@Test
	void resolvesSynonymsDisplayedNumber() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity synonyms = module(ModuleType.SYNONYMS, true, Map.of("displayedNumber", 7));
		bomb.setModules(List.of(souvenir, synonyms));

		assertThat(solve(bomb, souvenir, synonyms.getId(), "displayedNumber", List.of("0", "3", "7", "9"), false))
			.isEqualTo(new SouvenirOutput("7", 3));
	}

	@Test
	void resolvesTapCodeReceivedWord() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity tapCode = module(ModuleType.TAP_CODE, true, Map.of("receivedWord", "child"));
		bomb.setModules(List.of(souvenir, tapCode));

		assertThat(solve(bomb, souvenir, tapCode.getId(), "receivedWord", List.of("Style", "Child", "Shake"), false).answer())
			.isEqualTo("Child");
	}

	@Test
	void resolvesFastMathLastPairAfterAReset() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity fastMath = module(ModuleType.FAST_MATH, true, Map.of(
			"pairHistory", List.of("AB", "DG", "ZX"),
			"lastPair", "ZX"
		));
		bomb.setModules(List.of(souvenir, fastMath));

		assertThat(solve(bomb, souvenir, fastMath.getId(),
			"What was the last pair of letters in Fast Math?",
			List.of("AB", "DG", "KX", "NA", "TX", "ZX"), false))
			.isEqualTo(new SouvenirOutput("ZX", 6));
	}

	@Test
	void resolvesLedGridUnlitCount() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity ledGrid = module(ModuleType.LED_GRID, true, Map.of("unlitCount", 3));
		bomb.setModules(List.of(souvenir, ledGrid));

		assertThat(solve(bomb, souvenir, ledGrid.getId(), "unlitCount", List.of(), false))
			.isEqualTo(new SouvenirOutput("3", null));
		assertThat(solve(bomb, souvenir, ledGrid.getId(), "How many LEDs were unlit in LED Grid?",
			List.of("0", "1", "2", "3", "4"), false)).isEqualTo(new SouvenirOutput("3", 4));
	}

	@Test
	void resolvesEveryMashematicsEquationPosition() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity mashematics = module(ModuleType.MASHEMATICS, true, Map.of("numbers", List.of(96, 3, 99)));
		bomb.setModules(List.of(souvenir, mashematics));

		assertThat(solve(bomb, souvenir, mashematics.getId(), "first number", List.of(), false))
			.isEqualTo(new SouvenirOutput("96", null));
		assertThat(solve(bomb, souvenir, mashematics.getId(), "second number", List.of(), false))
			.isEqualTo(new SouvenirOutput("3", null));
		assertThat(solve(bomb, souvenir, mashematics.getId(),
			"What was the third number in the equation on Mashematics?",
			List.of("0", "3", "96", "99"), false)).isEqualTo(new SouvenirOutput("99", 4));
	}

	@Test
	void resolvesSillySlotsReelAtTheRequestedStageAndPosition() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity sillySlots = module(ModuleType.SILLY_SLOTS, true, Map.of(
			"displayHistory", List.of(
				List.of("red bomb", "blue grape", "green coin"),
				List.of("blue cherry", "green bomb", "red grape")
			)
		));
		bomb.setModules(List.of(souvenir, sillySlots));

		assertThat(solve(bomb, souvenir, sillySlots.getId(),
			"What was the second slot in the second stage in Silly Slots?",
			List.of("red bomb", "green bomb", "green cherry", "blue grape"), false))
			.isEqualTo(new SouvenirOutput("green bomb", 2));
	}

	@Test
	void resolvesEachColorMorseQuestionFamilyAtTheRequestedLed() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity colorMorse = module(ModuleType.COLOR_MORSE, true, Map.of(
			"colors", List.of("Red", "Orange", "Blue"),
			"characters", List.of("3", "6", "B")
		));
		bomb.setModules(List.of(souvenir, colorMorse));

		assertThat(solve(bomb, souvenir, colorMorse.getId(),
			"What was the color of the second LED in Color Morse?",
			List.of("Blue", "Green", "Orange", "Purple", "Red", "Yellow"), false))
			.isEqualTo(new SouvenirOutput("Orange", 3));
		assertThat(solve(bomb, souvenir, colorMorse.getId(), "third character", List.of(), false))
			.isEqualTo(new SouvenirOutput("B", null));
	}

	@Test
	void resolvesBigCircleSpinDirection() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity bigCircle = module(ModuleType.BIG_CIRCLE, true, Map.of("spinDirection", "counterclockwise"));
		bomb.setModules(List.of(souvenir, bigCircle));

		assertThat(solve(bomb, souvenir, bigCircle.getId(), "spinDirection", List.of(), false))
			.isEqualTo(new SouvenirOutput("counterclockwise", null));
	}

	@Test
	void resolvesPolyhedralMazeStartingPositionWithoutZeroPadding() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maze = module(ModuleType.POLYHEDRAL_MAZE, true, Map.of("startPosition", 0));
		bomb.setModules(List.of(souvenir, maze));

		assertThat(solve(bomb, souvenir, maze.getId(), "startPosition", List.of(), false))
			.isEqualTo(new SouvenirOutput("0", null));
		assertThat(solve(bomb, souvenir, maze.getId(),
			"What was the starting position in Polyhedral Maze?", List.of("13", "0", "29", "35"), false))
			.isEqualTo(new SouvenirOutput("0", 2));
	}

	@Test
	void resolvesBothSymbolCycleScreenCounts() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity symbolCycle = module(ModuleType.SYMBOL_CYCLE, true, Map.of(
			"leftCycleLength", 3, "rightCycleLength", 4
		));
		bomb.setModules(List.of(souvenir, symbolCycle));

		assertThat(solve(bomb, souvenir, symbolCycle.getId(), "leftSymbolCount", List.of(), false))
			.isEqualTo(new SouvenirOutput("3", null));
		assertThat(solve(bomb, souvenir, symbolCycle.getId(), "rightSymbolCount", List.of(), false))
			.isEqualTo(new SouvenirOutput("4", null));
		assertThat(solve(bomb, souvenir, symbolCycle.getId(),
			"How many symbols were cycling on the right screen in Symbol Cycle?",
			List.of("2", "3", "4", "5"), false)).isEqualTo(new SouvenirOutput("4", 3));
	}

	@Test
	void resolvesEverySymbolicCoordinatesStageAndPosition() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity symbolicCoordinates = module(ModuleType.SYMBOLIC_COORDINATES, true, Map.of("stageSymbols", List.of(
			List.of("A", "C", "E"), List.of("L", "P", "A"), List.of("C", "E", "L")
		)));
		bomb.setModules(List.of(souvenir, symbolicCoordinates));

		String[][] questions = {
			{"firstLeftSymbol", "A"}, {"firstMiddleSymbol", "C"}, {"firstRightSymbol", "E"},
			{"secondLeftSymbol", "L"}, {"secondMiddleSymbol", "P"}, {"secondRightSymbol", "A"},
			{"thirdLeftSymbol", "C"}, {"thirdMiddleSymbol", "E"}, {"thirdRightSymbol", "L"}
		};
		for (String[] question : questions) assertThat(solve(
			bomb, souvenir, symbolicCoordinates.getId(), question[0], List.of(), false
		)).isEqualTo(new SouvenirOutput(question[1], null));

		assertThat(solve(bomb, souvenir, symbolicCoordinates.getId(),
			"What was the middle symbol in the second stage of Symbolic Coordinates?",
			List.of("A", "C", "E", "L", "P"), false)).isEqualTo(new SouvenirOutput("P", 5));
	}

	@Test
	void resolvesHuntingDisplayedPictogramsForEveryStage() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity hunting = module(ModuleType.HUNTING, true, Map.of("clueHistory", List.of(
			List.of("o_", "M"), List.of("U", "W"), List.of("z_", "f_"), List.of("H", "A")
		)));
		bomb.setModules(List.of(souvenir, hunting));

		assertThat(solve(bomb, souvenir, hunting.getId(), "firstDisplayedSymbols", List.of(), false))
			.isEqualTo(new SouvenirOutput("o, M", null));
		assertThat(solve(bomb, souvenir, hunting.getId(), "secondDisplayedSymbols", List.of(), false))
			.isEqualTo(new SouvenirOutput("U, W", null));
		assertThat(solve(bomb, souvenir, hunting.getId(), "thirdDisplayedSymbols", List.of(), false))
			.isEqualTo(new SouvenirOutput("z, f", null));
		assertThat(solve(bomb, souvenir, hunting.getId(), "fourthDisplayedSymbols", List.of(), false))
			.isEqualTo(new SouvenirOutput("H, A", null));
		assertThat(solve(bomb, souvenir, hunting.getId(),
			"Which of these symbols was displayed in the third stage of Hunting?",
			List.of("M", "U", "f_", "H", "o_", "A"), false))
			.isEqualTo(new SouvenirOutput("f_", 3));
	}

	@Test
	void resolvesEveryIPhonePinDigit() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity phone = module(ModuleType.THE_IPHONE, true, Map.of("pinDigits", List.of(7, 2, 5, 9)));
		bomb.setModules(List.of(souvenir, phone));

		assertThat(solve(bomb, souvenir, phone.getId(), "firstPinDigit", List.of(), false)).isEqualTo(new SouvenirOutput("7", null));
		assertThat(solve(bomb, souvenir, phone.getId(), "secondPinDigit", List.of(), false)).isEqualTo(new SouvenirOutput("2", null));
		assertThat(solve(bomb, souvenir, phone.getId(), "thirdPinDigit", List.of(), false)).isEqualTo(new SouvenirOutput("5", null));
		assertThat(solve(bomb, souvenir, phone.getId(), "fourthPinDigit", List.of(), false)).isEqualTo(new SouvenirOutput("9", null));
		assertThat(solve(bomb, souvenir, phone.getId(), "What was the third PIN digit in The iPhone?",
			List.of("0", "2", "5", "7", "8", "9"), false)).isEqualTo(new SouvenirOutput("5", 3));
	}

	@Test
	void resolvesEveryBurglarAlarmDisplayedDigit() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity alarm = module(ModuleType.BURGLAR_ALARM, true,
			Map.of("moduleNumber", List.of(1, 2, 3, 4, 5, 6, 7, 8)));
		bomb.setModules(List.of(souvenir, alarm));
		List<String> ordinals = List.of("first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth");

		for (int i = 0; i < ordinals.size(); i++) {
			assertThat(solve(bomb, souvenir, alarm.getId(), ordinals.get(i) + "DisplayedDigit", List.of(), false))
				.isEqualTo(new SouvenirOutput(String.valueOf(i + 1), null));
		}
		assertThat(solve(bomb, souvenir, alarm.getId(),
			"What was the third displayed digit in Burglar Alarm?",
			List.of("0", "2", "3", "5", "7", "9"), false)).isEqualTo(new SouvenirOutput("3", 3));
	}

	@Test
	void resolvesEveryPieDisplayedDigit() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity pie = module(ModuleType.PIE, true, Map.of("displayedDigits", List.of(3, 1, 4, 1, 5)));
		bomb.setModules(List.of(souvenir, pie));
		List<String> ordinals = List.of("first", "second", "third", "fourth", "fifth");

		for (int i = 0; i < ordinals.size(); i++) {
			assertThat(solve(bomb, souvenir, pie.getId(), ordinals.get(i) + "DisplayedDigit", List.of(), false))
				.isEqualTo(new SouvenirOutput(String.valueOf(List.of(3, 1, 4, 1, 5).get(i)), null));
		}
		assertThat(solve(bomb, souvenir, pie.getId(),
			"What was the third digit of the displayed number in Pie?",
			List.of("0", "2", "4", "6", "7", "9"), false)).isEqualTo(new SouvenirOutput("4", 3));
	}

	@Test
	void resolvesEveryTheWireQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity wire = module(ModuleType.THE_WIRE, true, Map.of(
			"dialColors", List.of("BLUE", "GREY", "RED"), "displayedNumber", 4
		));
		bomb.setModules(List.of(souvenir, wire));

		assertThat(solve(bomb, souvenir, wire.getId(), "What was the color of the top dial in The Wire?",
			List.of("Blue", "Green", "Grey", "Orange", "Purple", "Red"), false)).isEqualTo(new SouvenirOutput("Blue", 1));
		assertThat(solve(bomb, souvenir, wire.getId(), "What was the color of the bottom-left dial in The Wire?",
			List.of("Blue", "Green", "Grey", "Orange", "Purple", "Red"), false)).isEqualTo(new SouvenirOutput("Grey", 3));
		assertThat(solve(bomb, souvenir, wire.getId(), "What was the color of the bottom-right dial in The Wire?",
			List.of("Blue", "Green", "Grey", "Orange", "Purple", "Red"), false)).isEqualTo(new SouvenirOutput("Red", 6));
		assertThat(solve(bomb, souvenir, wire.getId(), "What was the displayed number in The Wire?",
			List.of("0", "2", "4", "6", "8", "9"), false)).isEqualTo(new SouvenirOutput("4", 3));
	}

	@Test
	void resolvesEveryLogicGatesQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity logicGates = module(ModuleType.LOGIC_GATES, true, Map.of(
			"gates", List.of("AND", "OR", "XOR", "NAND", "XOR", "XNOR", "NOR")
		));
		bomb.setModules(List.of(souvenir, logicGates));

		assertThat(solve(bomb, souvenir, logicGates.getId(), "gateA", List.of(), false).answer()).isEqualTo("AND");
		assertThat(solve(bomb, souvenir, logicGates.getId(), "gateB", List.of(), false).answer()).isEqualTo("OR");
		assertThat(solve(bomb, souvenir, logicGates.getId(), "gateC", List.of(), false).answer()).isEqualTo("XOR");
		assertThat(solve(bomb, souvenir, logicGates.getId(), "gateD", List.of(), false).answer()).isEqualTo("NAND");
		assertThat(solve(bomb, souvenir, logicGates.getId(), "What was gate D in Logic Gates?",
			List.of("AND", "OR", "XOR", "NAND", "NOR", "XNOR"), false)).isEqualTo(new SouvenirOutput("NAND", 4));
	}

	@Test
	void resolvesEveryColorDecodingQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity colorDecoding = module(ModuleType.COLOR_DECODING, true, Map.of("stages", List.of(
			Map.of("pattern", "CHECKERED", "indicatorColors", List.of("RED", "BLUE")),
			Map.of("pattern", "HORIZONTAL", "indicatorColors", List.of("GREEN", "BLUE", "PURPLE")),
			Map.of("pattern", "SOLID", "indicatorColors", List.of("YELLOW"))
		)));
		bomb.setModules(List.of(souvenir, colorDecoding));

		assertThat(solve(bomb, souvenir, colorDecoding.getId(), "second indicator pattern", List.of(), false))
			.isEqualTo(new SouvenirOutput("HORIZONTAL", null));
		assertThat(solve(bomb, souvenir, colorDecoding.getId(), "colors appeared in first indicator", List.of(), false))
			.isEqualTo(new SouvenirOutput("RED, BLUE", null));
		assertThat(solve(bomb, souvenir, colorDecoding.getId(), "colors did not appear in second indicator", List.of(), false))
			.isEqualTo(new SouvenirOutput("RED, YELLOW", null));
		assertThat(solve(bomb, souvenir, colorDecoding.getId(),
			"What was the second-stage indicator pattern in Color Decoding?",
			List.of("Checkered", "Horizontal", "Vertical", "Solid"), false))
			.isEqualTo(new SouvenirOutput("Horizontal", 2));
		assertThat(solve(bomb, souvenir, colorDecoding.getId(),
			"Which color appeared in the first-stage indicator pattern in Color Decoding?",
			List.of("Red", "Green", "Yellow", "Purple"), false))
			.isEqualTo(new SouvenirOutput("Red", 1));
		assertThat(solve(bomb, souvenir, colorDecoding.getId(),
			"Which color did not appear in the second-stage indicator pattern in Color Decoding?",
			List.of("Red", "Green", "Blue", "Purple"), false))
			.isEqualTo(new SouvenirOutput("Red", 1));
	}

	@Test
	void resolvesTheErrorCodesActiveError() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity errorCodes = module(ModuleType.ERROR_CODES, true, Map.of("activeErrorCode", "3A"));
		bomb.setModules(List.of(souvenir, errorCodes));

		assertThat(solve(bomb, souvenir, errorCodes.getId(), "activeErrorCode", List.of(), false))
			.isEqualTo(new SouvenirOutput("3A", null));
		assertThat(solve(bomb, souvenir, errorCodes.getId(), "What was the active error code in Error Codes?",
			List.of("0F", "21", "3A", "40", "52", "65"), false)).isEqualTo(new SouvenirOutput("3A", 3));
	}

	@Test
	void resolvesTheUsaMazeDepartureState() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity usaMaze = module(ModuleType.USA_MAZE, true, Map.of("souvenirState", "California"));
		bomb.setModules(List.of(souvenir, usaMaze));

		assertThat(solve(bomb, souvenir, usaMaze.getId(), "departureState", List.of(), false))
			.isEqualTo(new SouvenirOutput("California", null));
		assertThat(solve(bomb, souvenir, usaMaze.getId(), "Which state did you depart from in USA Maze?",
			List.of("Arizona", "California", "Nevada", "Oregon"), false))
			.isEqualTo(new SouvenirOutput("California", 2));
	}

	@Test
	void resolvesEveryMorseWarQuestionAndDisplayedLedSprite() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity morseWar = module(ModuleType.MORSE_WAR, true, Map.of(
			"morseCode", "SUN", "bottomRow", "0110", "middleRow", "0101", "topRow", "0011"
		));
		bomb.setModules(List.of(souvenir, morseWar));

		assertThat(solve(bomb, souvenir, morseWar.getId(), "transmittedCode", List.of(), false).answer()).isEqualTo("SUN");
		assertThat(solve(bomb, souvenir, morseWar.getId(), "led bottom", List.of(), false).answer()).isEqualTo("○●●○");
		assertThat(solve(bomb, souvenir, morseWar.getId(), "led middle", List.of(), false).answer()).isEqualTo("○●○●");
		assertThat(solve(bomb, souvenir, morseWar.getId(), "led top", List.of(), false).answer()).isEqualTo("○○●●");
		assertThat(solve(bomb, souvenir, morseWar.getId(), "What were the LEDs in the bottom row in Morse War?",
			List.of("●●○○", "●○●○", "●○○●", "○●●○", "○●○●", "○○●●"), false))
			.isEqualTo(new SouvenirOutput("○●●○", 4));
	}

	@Test
	void resolvesBoggleInitiallyVisibleLetters() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity boggle = module(ModuleType.BOGGLE, true, Map.of("visibleLetters", List.of("I", "N", "C", "R")));
		bomb.setModules(List.of(souvenir, boggle));

		assertThat(solve(bomb, souvenir, boggle.getId(), "visibleLetters", List.of(), false).answer()).isEqualTo("I, N, C, R");
		assertThat(solve(bomb, souvenir, boggle.getId(), "What letter was initially visible on Boggle?",
			List.of("A", "I", "Z", "O", "P", "Q"), false)).isEqualTo(new SouvenirOutput("I", 2));
	}

	@Test
	void resolvesAllHorribleMemoryQuestionFamiliesAndArguments() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		String[] ordinals = {"first", "second", "third", "fourth", "fifth", "sixth"};
		String[] colors = {"blue", "green", "red", "orange", "purple", "pink"};
		List<Map<String, Object>> stages = new java.util.ArrayList<>();
		for (int stage = 0; stage < 4; stage++) {
			List<Map<String, Object>> buttons = new java.util.ArrayList<>();
			for (int position = 0; position < 6; position++) buttons.add(Map.of(
				"label", (position + stage) % 6 + 1, "color", colors[(position + 2 * stage) % 6]));
			stages.add(Map.of("display", stage + 1, "buttons", buttons));
		}
		ModuleEntity horrible = module(ModuleType.HORRIBLE_MEMORY, true, Map.of("completedStages", 5, "stages", stages));
		bomb.setModules(List.of(souvenir, horrible));

		for (int stage = 0; stage < 4; stage++) {
			@SuppressWarnings("unchecked") List<Map<String, Object>> buttons = (List<Map<String, Object>>) stages.get(stage).get("buttons");
			for (int position = 0; position < 6; position++) {
				String stageName = ordinals[stage], positionName = ordinals[position];
				String color = String.valueOf(buttons.get(position).get("color")), label = String.valueOf(buttons.get(position).get("label"));
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the color of the button in the " + positionName + " position in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(color);
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the label of the button in the " + positionName + " position in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(label);
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the color of the button labeled " + label + " in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(color);
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the label of the " + color + " button in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(label);
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the position of the " + color + " button in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(positionName);
				assertThat(solve(bomb, souvenir, horrible.getId(), "What was the position of the button labeled " + label + " in the " + stageName + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(positionName);
			}
			assertThat(solve(bomb, souvenir, horrible.getId(), "What number was displayed in the " + ordinals[stage] + " stage of Horrible Memory?", List.of(), false).answer()).isEqualTo(String.valueOf(stage + 1));
		}
		assertThat(solve(bomb, souvenir, horrible.getId(), "What was the color of the button in the first position in the first stage of Horrible Memory?", List.of(colors), false)).isEqualTo(new SouvenirOutput("blue", 1));
		assertThat(solve(bomb, souvenir, horrible.getId(), "What was the label of the button in the first position in the second stage of Horrible Memory?", List.of("1", "2", "3", "4", "5", "6"), false)).isEqualTo(new SouvenirOutput("2", 2));
		assertThat(solve(bomb, souvenir, horrible.getId(), "What was the position of the red button in the first stage of Horrible Memory?", List.of(ordinals), false)).isEqualTo(new SouvenirOutput("third", 3));
	}

	@Test void resolvesBothSonicKnucklesSpriteFamilies() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity sonic=module(ModuleType.SONIC_KNUCKLES,true,Map.of("badnik","Ghost","monitor","Running Boots"));bomb.setModules(List.of(souvenir,sonic));
		assertThat(solve(bomb,souvenir,sonic.getId(),"badnik",List.of(),false).answer()).isEqualTo("Ghost");
		assertThat(solve(bomb,souvenir,sonic.getId(),"monitor",List.of(),false).answer()).isEqualTo("Running Boots");
		assertThat(solve(bomb,souvenir,sonic.getId(),"Which badnik was shown in Sonic & Knuckles?",List.of("Cluckoid","Ghost","Technosqueak","Butterdroid"),false)).isEqualTo(new SouvenirOutput("Ghost",2));
	}

	@Test void resolvesEveryQuintuplesFamilyAndArgument() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<Integer> numbers = java.util.stream.IntStream.range(0, 25).map(index -> index % 10).boxed().toList();
		List<String> colors = java.util.stream.IntStream.range(0, 25).mapToObj(index -> List.of("red", "blue", "orange", "green", "pink").get(index % 5)).toList();
		Map<String, Integer> counts = Map.of("red", 5, "blue", 5, "orange", 5, "green", 5, "pink", 5);
		ModuleEntity quintuples = module(ModuleType.QUINTUPLES, true, Map.of("quintuplesNumbers", numbers, "quintuplesColors", colors, "quintuplesColorCounts", counts));
		bomb.setModules(List.of(souvenir, quintuples));
		String[] ordinal = {"first", "second", "third", "fourth", "fifth"};
		for (int slot = 0; slot < 5; slot++) for (int digit = 0; digit < 5; digit++) {
			String numberQuestion = "What was the " + ordinal[digit] + " digit in the " + ordinal[slot] + " slot in Quintuples?";
			String colorQuestion = "What color was the " + ordinal[digit] + " digit in the " + ordinal[slot] + " slot in Quintuples?";
			assertThat(solve(bomb, souvenir, quintuples.getId(), numberQuestion, List.of(), false).answer()).isEqualTo(String.valueOf(numbers.get(slot * 5 + digit)));
			assertThat(solve(bomb, souvenir, quintuples.getId(), colorQuestion, List.of(), false).answer()).isEqualTo(colors.get(slot * 5 + digit));
		}
		for (String color : counts.keySet())
			assertThat(solve(bomb, souvenir, quintuples.getId(), "How many numbers were " + color + " in Quintuples?", List.of(), false).answer()).isEqualTo("5");
		assertThat(solve(bomb, souvenir, quintuples.getId(), "What color was the second digit in the first slot in Quintuples?", List.of("pink", "blue", "green", "red"), false)).isEqualTo(new SouvenirOutput("blue", 2));
	}

	@Test void resolvesAllFiveSphereColorArguments() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());List<String> colors=List.of("red","purple","grey","white","blue");ModuleEntity sphere=module(ModuleType.THE_SPHERE,true,Map.of("sphereColors",colors));bomb.setModules(List.of(souvenir,sphere));String[] ordinal={"first","second","third","fourth","fifth"};
		for(int i=0;i<5;i++)assertThat(solve(bomb,souvenir,sphere.getId(),"What was the "+ordinal[i]+" flashed color in The Sphere?",List.of(),false).answer()).isEqualTo(colors.get(i));
		assertThat(solve(bomb,souvenir,sphere.getId(),"What was the third flashed color in The Sphere?",List.of("white","pink","grey","green","orange","blue"),false)).isEqualTo(new SouvenirOutput("grey",3));
	}

	@Test void resolvesEveryCoffeebucksPreferenceFamily() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity coffee=module(ModuleType.COFFEEBUCKS,true,Map.of("coffeebucksSugar","Sugar is murder","coffeebucksTime","Evening","coffeebucksStress","Stressed","coffeebucksSize","Tall"));bomb.setModules(List.of(souvenir,coffee));
		assertThat(solve(bomb,souvenir,coffee.getId(),"sugar",List.of(),false).answer()).isEqualTo("Sugar is murder");assertThat(solve(bomb,souvenir,coffee.getId(),"time",List.of(),false).answer()).isEqualTo("Evening");assertThat(solve(bomb,souvenir,coffee.getId(),"stress",List.of(),false).answer()).isEqualTo("Stressed");assertThat(solve(bomb,souvenir,coffee.getId(),"size",List.of(),false).answer()).isEqualTo("Tall");
		assertThat(solve(bomb,souvenir,coffee.getId(),"What was the last customer’s preferred sugar content in Coffeebucks?",List.of("Loads","Just a bit","Sugar is murder","Diabetic in-waiting"),false)).isEqualTo(new SouvenirOutput("Sugar is murder",3));
	}

	@Test void resolvesBothLionsShareFamiliesIncludingMultipleRemovedLions() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity lions=module(ModuleType.LIONS_SHARE,true,Map.of("lionsShareYear",1,"lionsShareRemovedLions",List.of("Mufasa","Taka")));bomb.setModules(List.of(souvenir,lions));
		assertThat(solve(bomb,souvenir,lions.getId(),"year",List.of(),false).answer()).isEqualTo("1");assertThat(solve(bomb,souvenir,lions.getId(),"removedLions",List.of(),false).answer()).isEqualTo("Mufasa, Taka");
		assertThat(solve(bomb,souvenir,lions.getId(),"Which year was displayed on Lion’s Share?",List.of("3","1","2","4","5","6"),false)).isEqualTo(new SouvenirOutput("1",2));
		assertThat(solve(bomb,souvenir,lions.getId(),"Which lion was present but removed in Lion’s Share?",List.of("Simba","Taka","Nala","Uru"),false)).isEqualTo(new SouvenirOutput("Taka",2));
	}

	@Test void resolvesSnookerRedsFromTheFinalSuccessfulFrame() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity snooker=module(ModuleType.SNOOKER,true,Map.of("snookerReds",9));bomb.setModules(List.of(souvenir,snooker));
		assertThat(solve(bomb,souvenir,snooker.getId(),"reds",List.of(),false).answer()).isEqualTo("9");assertThat(solve(bomb,souvenir,snooker.getId(),"How many red balls were there at the start of Snooker?",List.of("8","9","10"),false)).isEqualTo(new SouvenirOutput("9",2));
	}

	@Test void resolvesAccumulationBorderAndAllFiveBackgroundStages() {
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());List<String> backgrounds=List.of("Orange","Green","Yellow","Brown","Lime");ModuleEntity accumulation=module(ModuleType.ACCUMULATION,true,Map.of("accumulationBorderColor","Blue","accumulationBackgroundColors",backgrounds));bomb.setModules(List.of(souvenir,accumulation));
		assertThat(solve(bomb,souvenir,accumulation.getId(),"borderColor",List.of(),false).answer()).isEqualTo("Blue");String[] ordinal={"first","second","third","fourth","fifth"};
		for(int i=0;i<5;i++)assertThat(solve(bomb,souvenir,accumulation.getId(),"background "+ordinal[i],List.of(),false).answer()).isEqualTo(backgrounds.get(i));
		assertThat(solve(bomb,souvenir,accumulation.getId(),"What was the border color in Accumulation?",List.of("Red","Blue","Grey","White","Pink","Green"),false)).isEqualTo(new SouvenirOutput("Blue",2));
		assertThat(solve(bomb,souvenir,accumulation.getId(),"What was the background color in the fourth stage in Accumulation?",List.of("Blue","Brown","Green","Grey","Lime","Orange"),false)).isEqualTo(new SouvenirOutput("Brown",2));
	}

	@Test
	void resolvesEveryMazeScramblerQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity mazeScrambler = module(ModuleType.MAZE_SCRAMBLER, true, Map.of(
			"startPosition", "top-left", "goalPosition", "bottom-right",
			"mazeMarkings", List.of("top-middle", "bottom-left")
		));
		bomb.setModules(List.of(souvenir, mazeScrambler));

		assertThat(solve(bomb, souvenir, mazeScrambler.getId(), "startPosition", List.of(), false).answer())
			.isEqualTo("top-left");
		assertThat(solve(bomb, souvenir, mazeScrambler.getId(), "goalPosition", List.of(), false).answer())
			.isEqualTo("bottom-right");
		assertThat(solve(bomb, souvenir, mazeScrambler.getId(), "mazeMarkings", List.of(), false).answer())
			.isEqualTo("top-middle, bottom-left");
		assertThat(solve(bomb, souvenir, mazeScrambler.getId(),
			"Which of these positions was a maze marking on Maze Scrambler?",
			List.of("top-left", "center", "bottom-left", "bottom-right"), false))
			.isEqualTo(new SouvenirOutput("bottom-left", 3));
	}

	@Test
	void resolvesEveryAlphabetNumbersStage() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity alphabetNumbers = module(ModuleType.ALPHABET_NUMBERS, true, Map.of(
			"stage1Numbers", List.of(1, 2, 3, 4, 5, 6),
			"stage2Numbers", List.of(7, 8, 9, 10, 11, 12),
			"stage3Numbers", List.of(13, 14, 15, 16, 17, 18),
			"stage4Numbers", List.of(27, 28, 29, 30, 31, 32)
		));
		bomb.setModules(List.of(souvenir, alphabetNumbers));

		assertThat(solve(bomb, souvenir, alphabetNumbers.getId(), "displayedNumbers first", List.of(), false).answer())
			.isEqualTo("1, 2, 3, 4, 5, 6");
		assertThat(solve(bomb, souvenir, alphabetNumbers.getId(), "displayedNumbers second", List.of(), false).answer())
			.isEqualTo("7, 8, 9, 10, 11, 12");
		assertThat(solve(bomb, souvenir, alphabetNumbers.getId(), "displayedNumbers third", List.of(), false).answer())
			.isEqualTo("13, 14, 15, 16, 17, 18");
		assertThat(solve(bomb, souvenir, alphabetNumbers.getId(), "displayedNumbers fourth", List.of(), false).answer())
			.isEqualTo("27, 28, 29, 30, 31, 32");
		assertThat(solve(bomb, souvenir, alphabetNumbers.getId(),
			"Which of these numbers was on one of the buttons in the fourth stage of Alphabet Numbers?",
			List.of("4", "18", "31", "9", "14", "22"), false))
			.isEqualTo(new SouvenirOutput("31", 3));
	}

	@Test
	void resolvesBothSuccessfulAttemptDoubleColorStages() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity doubleColor = module(ModuleType.DOUBLE_COLOR, true, Map.of(
			"stage1Color", "Blue", "stage2Color", "Pink"
		));
		bomb.setModules(List.of(souvenir, doubleColor));

		assertThat(solve(bomb, souvenir, doubleColor.getId(), "screenColor first", List.of(), false).answer())
			.isEqualTo("Blue");
		assertThat(solve(bomb, souvenir, doubleColor.getId(), "screenColor second", List.of(), false).answer())
			.isEqualTo("Pink");
		assertThat(solve(bomb, souvenir, doubleColor.getId(),
			"What was the screen color on the first stage of Double Color?",
			List.of("Green", "Blue", "Red", "Pink"), false))
			.isEqualTo(new SouvenirOutput("Blue", 2));
	}

	@Test
	void resolvesBothMaritimeFlagsQuestionFamilies() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity maritimeFlags = module(ModuleType.MARITIME_FLAGS, true, Map.of(
			"callsign", "CAPTAIN", "signalledBearing", 100
		));
		bomb.setModules(List.of(souvenir, maritimeFlags));

		assertThat(solve(bomb, souvenir, maritimeFlags.getId(), "bearing", List.of(), false).answer()).isEqualTo("100");
		assertThat(solve(bomb, souvenir, maritimeFlags.getId(), "callsign", List.of(), false).answer()).isEqualTo("captain");
		assertThat(solve(bomb, souvenir, maritimeFlags.getId(), "Which callsign was signalled in Maritime Flags?",
			List.of("admiral", "captain", "station", "weather"), false))
			.isEqualTo(new SouvenirOutput("captain", 2));
	}

	@Test
	void resolvesAndMatchesThePatternCubeHighlightedSprite() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity patternCube = module(ModuleType.PATTERN_CUBE, true, Map.of("highlightedSymbol", "X"));
		bomb.setModules(List.of(souvenir, patternCube));

		assertThat(solve(bomb, souvenir, patternCube.getId(), "highlightedSymbol", List.of(), false).answer()).isEqualTo("X");
		assertThat(solve(bomb, souvenir, patternCube.getId(), "Which symbol was highlighted in Pattern Cube?",
			List.of("A", "B", "X", "Y", "Z", "H"), false)).isEqualTo(new SouvenirOutput("X", 3));
	}

	@Test
	void resolvesEveryKnowYourWayQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity knowYourWay = module(ModuleType.KNOW_YOUR_WAY, true,
			Map.of("arrowDirection", "Down", "greenLed", "Left"));
		bomb.setModules(List.of(souvenir, knowYourWay));

		assertThat(solve(bomb, souvenir, knowYourWay.getId(), "arrowDirection", List.of(), false).answer()).isEqualTo("Down");
		assertThat(solve(bomb, souvenir, knowYourWay.getId(), "greenLed", List.of(), false).answer()).isEqualTo("Left");
		assertThat(solve(bomb, souvenir, knowYourWay.getId(), "Which way was the arrow pointing in Know Your Way?",
			List.of("Up", "Down", "Left", "Right"), false)).isEqualTo(new SouvenirOutput("Down", 2));
		assertThat(solve(bomb, souvenir, knowYourWay.getId(), "Which LED was green in Know Your Way?",
			List.of("Top", "Bottom", "Right", "Left"), false)).isEqualTo(new SouvenirOutput("Left", 4));
	}

	@Test
	void resolvesSplittingTheLootInitiallyColoredBag() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity loot = module(ModuleType.SPLITTING_THE_LOOT, true, Map.of("initiallyColoredBag", "E6"));
		bomb.setModules(List.of(souvenir, loot));

		assertThat(solve(bomb, souvenir, loot.getId(), "initiallyColoredBag", List.of(), false).answer()).isEqualTo("E6");
		assertThat(solve(bomb, souvenir, loot.getId(), "What bag was initially colored in Splitting The Loot?",
			List.of("A5", "E6", "19", "82", "C3", "40"), false)).isEqualTo(new SouvenirOutput("E6", 2));
	}

	@Test
	void resolvesEveryCharacterShiftQuestionFamily() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity shift = module(ModuleType.CHARACTER_SHIFT, true,
			Map.of("unsubmittedLetters", List.of("Y", "Z", "Q"), "unsubmittedDigits", List.of("1", "2", "3")));
		bomb.setModules(List.of(souvenir, shift));

		assertThat(solve(bomb, souvenir, shift.getId(), "unsubmittedLetters", List.of(), false).answer()).isEqualTo("Y, Z, Q");
		assertThat(solve(bomb, souvenir, shift.getId(), "unsubmittedDigits", List.of(), false).answer()).isEqualTo("1, 2, 3");
		assertThat(solve(bomb, souvenir, shift.getId(), "Which letter was present but not submitted on the left slider of Character Shift?",
			List.of("A", "B", "Q", "C", "D", "E"), false)).isEqualTo(new SouvenirOutput("Q", 3));
		assertThat(solve(bomb, souvenir, shift.getId(), "Which digit was present but not submitted on the right slider of Character Shift?",
			List.of("0", "4", "5", "2", "7", "9"), false)).isEqualTo(new SouvenirOutput("2", 4));
	}

	@Test
	void resolvesEverySimonSamplesCallAddition() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity samples = module(ModuleType.SIMON_SAMPLES, true,
			Map.of("callStage1", "KKSH", "callStage2", "KOSH", "callStage3", "SHHS"));
		bomb.setModules(List.of(souvenir, samples));

		assertThat(solve(bomb, souvenir, samples.getId(), "call first", List.of(), false).answer()).isEqualTo("KKSH");
		assertThat(solve(bomb, souvenir, samples.getId(), "call second", List.of(), false).answer()).isEqualTo("KOSH");
		assertThat(solve(bomb, souvenir, samples.getId(), "call third", List.of(), false).answer()).isEqualTo("SHHS");
		assertThat(solve(bomb, souvenir, samples.getId(), "What were the call samples added in the second stage of Simon Samples?",
			List.of("KKSS", "KHSS", "KOSH", "KOSO"), false)).isEqualTo(new SouvenirOutput("KOSH", 3));
	}

	@Test
	void resolvesDragonEnergyIndicatorColor() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity dragon = module(ModuleType.DRAGON_ENERGY, true, Map.of("indicatorColor", "Purple"));
		bomb.setModules(List.of(souvenir, dragon));

		assertThat(solve(bomb, souvenir, dragon.getId(), "indicatorColor", List.of(), false).answer()).isEqualTo("Purple");
		assertThat(solve(bomb, souvenir, dragon.getId(), "What color was the indicator in Dragon Energy?",
			List.of("Orange", "Cyan", "Purple"), false)).isEqualTo(new SouvenirOutput("Purple", 3));
	}

	@Test
	void resolvesBothUncoloredSquaresFirstStageColors() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity squares = module(ModuleType.UNCOLORED_SQUARES, true,
			Map.of("firstStageColor1", "Red", "firstStageColor2", "Green"));
		bomb.setModules(List.of(souvenir, squares));

		assertThat(solve(bomb, souvenir, squares.getId(), "firstStageColor first", List.of(), false).answer()).isEqualTo("Red");
		assertThat(solve(bomb, souvenir, squares.getId(), "firstStageColor second", List.of(), false).answer()).isEqualTo("Green");
		assertThat(solve(bomb, souvenir, squares.getId(),
			"What was the second color in reading order used in the first stage of Uncolored Squares?",
			List.of("Red", "Green", "Blue", "Yellow", "Magenta"), false)).isEqualTo(new SouvenirOutput("Green", 2));
	}

	@Test
	void resolvesEveryFlashingLightsLedColorFrequency() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		Map<String, Object> facts = new HashMap<>();
		String[] colors = {"Cyan", "Green", "Red", "Purple", "Orange"};
		for (int i = 0; i < colors.length; i++) { facts.put("top" + colors[i], i); facts.put("bottom" + colors[i], 12 - i); }
		ModuleEntity lights = module(ModuleType.FLASHING_LIGHTS, true, facts);
		bomb.setModules(List.of(souvenir, lights));

		for (int i = 0; i < colors.length; i++) {
			String color = colors[i].toLowerCase();
			assertThat(solve(bomb, souvenir, lights.getId(), "ledFrequency top " + color, List.of(), false).answer()).isEqualTo(Integer.toString(i));
			assertThat(solve(bomb, souvenir, lights.getId(), "ledFrequency bottom " + color, List.of(), false).answer()).isEqualTo(Integer.toString(12 - i));
		}
		assertThat(solve(bomb, souvenir, lights.getId(), "How many times did the bottom LED flash purple on Flashing Lights?",
			List.of("2", "4", "7", "9", "11", "12"), false)).isEqualTo(new SouvenirOutput("9", 4));
	}

	@Test
	void resolvesEveryThreeDTunnelsGoalNode() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity tunnels = module(ModuleType.THREE_D_TUNNELS, true, Map.of("target1", "h", "target2", "n", "target3", "."));
		bomb.setModules(List.of(souvenir, tunnels));

		assertThat(solve(bomb, souvenir, tunnels.getId(), "targetNode first", List.of(), false).answer()).isEqualTo("h");
		assertThat(solve(bomb, souvenir, tunnels.getId(), "targetNode second", List.of(), false).answer()).isEqualTo("n");
		assertThat(solve(bomb, souvenir, tunnels.getId(), "targetNode third", List.of(), false).answer()).isEqualTo(".");
		assertThat(solve(bomb, souvenir, tunnels.getId(), "What was the second goal node in 3D Tunnels?",
			List.of("g", "h", "n", ".", "x", "u"), false)).isEqualTo(new SouvenirOutput("n", 3));
	}

	@Test
	void resolvesBothSynchronizationQuestions() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity synchronization = module(ModuleType.SYNCHRONIZATION, true, Map.of("fastestLight", "C3", "centerSpeed", 2));
		bomb.setModules(List.of(souvenir, synchronization));

		assertThat(solve(bomb, souvenir, synchronization.getId(), "fastestLight", List.of(), false).answer()).isEqualTo("C3");
		assertThat(solve(bomb, souvenir, synchronization.getId(), "centerSpeed", List.of(), false).answer()).isEqualTo("2");
		assertThat(solve(bomb, souvenir, synchronization.getId(), "Which position initially had the fastest light in Synchronization?",
			List.of("A1", "B1", "C1", "A2", "B2", "C3"), false)).isEqualTo(new SouvenirOutput("C3", 6));
	}

	@Test
	void resolvesEverySwitchSuccessfulFlipColor() {
		BombEntity bomb = new BombEntity(); ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity source = module(ModuleType.THE_SWITCH, true, Map.of("stage1Top", "red", "stage1Bottom", "green", "stage2Top", "blue", "stage2Bottom", "yellow"));
		bomb.setModules(List.of(souvenir, source));
		assertThat(solve(bomb, souvenir, source.getId(), "ledColor top first", List.of(), false).answer()).isEqualTo("red");
		assertThat(solve(bomb, souvenir, source.getId(), "ledColor bottom first", List.of(), false).answer()).isEqualTo("green");
		assertThat(solve(bomb, souvenir, source.getId(), "ledColor top second", List.of(), false).answer()).isEqualTo("blue");
		assertThat(solve(bomb, souvenir, source.getId(), "ledColor bottom second", List.of(), false).answer()).isEqualTo("yellow");
		assertThat(solve(bomb, souvenir, source.getId(), "What color was the bottom LED on the second flip of The Switch?", List.of("red", "orange", "yellow", "green", "blue", "purple"), false)).isEqualTo(new SouvenirOutput("yellow", 3));
	}

	@Test
	void resolvesEveryReverseMorseSymbolAndColorQuestion() {
		BombEntity bomb = new BombEntity(); ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		List<Map<String, String>> first = List.of(
			Map.of("symbol", "A", "color", "red"), Map.of("symbol", "L", "color", "green"),
			Map.of("symbol", "Q", "color", "blue"), Map.of("symbol", "T", "color", "purple"),
			Map.of("symbol", "X", "color", "yellow"), Map.of("symbol", "Z", "color", "orange"));
		List<Map<String, String>> second = List.of(
			Map.of("symbol", "Z", "color", "red"), Map.of("symbol", "X", "color", "green"),
			Map.of("symbol", "T", "color", "blue"), Map.of("symbol", "Q", "color", "purple"),
			Map.of("symbol", "L", "color", "yellow"), Map.of("symbol", "A", "color", "orange"));
		ModuleEntity source = module(ModuleType.REVERSE_MORSE, true, Map.of(
			"message1Observations", first, "message2Observations", second));
		bomb.setModules(List.of(souvenir, source));
		String[] ordinals = {"first", "second", "third", "fourth", "fifth", "sixth"};
		for (int message = 0; message < 2; message++) for (int position = 0; position < 6; position++) {
			Map<String, String> expected = (message == 0 ? first : second).get(position);
			String suffix = ordinals[position] + " " + ordinals[message];
			assertThat(solve(bomb, souvenir, source.getId(), "symbol " + suffix, List.of(), false).answer()).isEqualTo(expected.get("symbol"));
			assertThat(solve(bomb, souvenir, source.getId(), "color " + suffix, List.of(), false).answer()).isEqualTo(expected.get("color"));
		}
		assertThat(solve(bomb, souvenir, source.getId(),
			"What was the fifth symbol in the first message of Reverse Morse?",
			List.of("A", "L", "Q", "T", "X", "Z"), false)).isEqualTo(new SouvenirOutput("X", 5));
		assertThat(solve(bomb, souvenir, source.getId(),
			"What was the color of the third symbol in the second message of Reverse Morse?",
			List.of("red", "green", "blue", "purple", "yellow", "orange"), false)).isEqualTo(new SouvenirOutput("blue", 3));
	}

	@Test
	void resolvesTheSwanResetCountOnlyWhenUpstreamSouvenirAsks() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity swan = module(ModuleType.THE_SWAN, true, Map.of("resetCount", 13));
		bomb.setModules(List.of(souvenir, swan));

		assertThat(solve(bomb, souvenir, swan.getId(), "resetCount", List.of(), false))
			.isEqualTo(new SouvenirOutput("13", null));
		assertThat(solve(bomb, souvenir, swan.getId(), "How many times was the system reset in The Swan?",
			List.of("3", "7", "13", "18", "21", "24"), false)).isEqualTo(new SouvenirOutput("13", 3));

		ModuleEntity longSwan = module(ModuleType.THE_SWAN, true, Map.of("resetCount", 25));
		bomb.setModules(List.of(souvenir, longSwan));
		assertThat(solver.solve(new RoundEntity(), bomb, souvenir,
			new SouvenirInput(longSwan.getId(), "resetCount", List.of(), false))).isInstanceOf(SolveFailure.class);
	}

	@Test void resolvesAnyOfTheFourFinalTWords(){
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());List<String> words=List.of("Terpsichorean","Tachygraphy","Tabernacular","Tectosphere");ModuleEntity source=module(ModuleType.T_WORDS,true,Map.of("tWordsWords",words));bomb.setModules(List.of(souvenir,source));
		assertThat(solve(bomb,souvenir,source.getId(),"words",List.of(),false).answer()).isEqualTo("Terpsichorean, Tachygraphy, Tabernacular, Tectosphere");
		assertThat(solve(bomb,souvenir,source.getId(),"Which word was present in T-Words?",List.of("Taphephobia","Tectosphere","Tatterdemalion","Tautochronous"),false)).isEqualTo(new SouvenirOutput("Tectosphere",2));
	}

	@Test void resolvesDividedSquaresPressedColorOnlyWhenEligible(){
		BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.DIVIDED_SQUARES,true,Map.of("dividedSquaresColorB","Green","dividedSquaresSouvenirEligible",true));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"pressedColor",List.of(),false).answer()).isEqualTo("Green");assertThat(solve(bomb,souvenir,source.getId(),"What color was the correct square while pressing it in Divided Squares?",List.of("Red","Yellow","Green","Blue","Black","White"),false)).isEqualTo(new SouvenirOutput("Green",3));
		ModuleEntity noQuestion=module(ModuleType.DIVIDED_SQUARES,true,Map.of("dividedSquaresColorB","Blue","dividedSquaresSouvenirEligible",false));bomb.setModules(List.of(souvenir,noQuestion));assertThat(solver.solve(new RoundEntity(),bomb,souvenir,new SouvenirInput(noQuestion.getId(),"pressedColor",List.of(),false))).isInstanceOf(SolveFailure.class);
	}

	@Test void resolvesValvesInitialStateVisual(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.VALVES,true,Map.of("valvesInitialState","101"));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"initialState",List.of(),false).answer()).isEqualTo("●○●");assertThat(solve(bomb,souvenir,source.getId(),"What was the initial state of Valves?",List.of("○○○","○●○","●○●","●●●"),false)).isEqualTo(new SouvenirOutput("●○●",3));assertThat(solve(bomb,souvenir,source.getId(),"initial state",List.of("000","010","101","111"),false)).isEqualTo(new SouvenirOutput("101",3));}

	@Test void resolvesAnyInitialLeftColumnBlockbustersLetter(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.BLOCKBUSTERS,true,Map.of("blockbustersInitialLetters",List.of("A","C","D","E")));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"firstLetters",List.of(),false).answer()).isEqualTo("A, C, D, E");assertThat(solve(bomb,souvenir,source.getId(),"Which letter was in the leftmost column at the start of Blockbusters?",List.of("B","C","F","G","H","I"),false)).isEqualTo(new SouvenirOutput("C",2));}

	@Test void resolvesEveryCatchphrasePanelColor(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.CATCHPHRASE,true,Map.of("catchphrasePanelColors",List.of("Red","Blue","Green","Orange")));bomb.setModules(List.of(souvenir,source));List<String>positions=List.of("top-left","top-right","bottom-left","bottom-right"),colors=List.of("Red","Blue","Green","Orange"),answers=List.of("Purple","Orange","Blue","Red","Yellow","Green");for(int i=0;i<4;i++){assertThat(solve(bomb,souvenir,source.getId(),"color "+positions.get(i),List.of(),false).answer()).isEqualTo(colors.get(i));assertThat(solve(bomb,souvenir,source.getId(),"What was the colour of the "+positions.get(i)+" panel in Catchphrase?",answers,false).answer()).isEqualTo(colors.get(i));}}

	@Test void resolvesEncryptedMorseReceivedKey(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.ENCRYPTED_MORSE,true,Map.of("encryptedMorseKey","QWERTYUI"));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"key",List.of(),false).answer()).isEqualTo("QWERTYUI");assertThat(solve(bomb,souvenir,source.getId(),"What was the received key in Encrypted Morse?",List.of("ZXCVBNMA","QWERTYUI","ASDFGHJK","POIUYTRE"),false)).isEqualTo(new SouvenirOutput("QWERTYUI",2));}

	@Test void resolvesAnyRetirementHomeOfferedButNotChosen(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.RETIREMENT,true,Map.of("retirementUnchosenHomes",List.of("Broadwood","Homestead","Hotham Place","Riverside")));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"houses",List.of(),false).answer()).isEqualTo("Broadwood, Homestead, Hotham Place, Riverside");assertThat(solve(bomb,souvenir,source.getId(),"Which one of these houses was on offer, but not chosen by Bob in Retirement?",List.of("Sunnydale","Hotham Place","Sunnyside","Leafy Green"),false)).isEqualTo(new SouvenirOutput("Hotham Place",2));}

	@Test void resolvesAllThreeSchlagDenBombFacts(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.SCHLAG_DEN_BOMB,true,Map.of("schlagContestantName","Gale","schlagContestantScore",47,"schlagBombScore",73));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"contestantName",List.of(),false).answer()).isEqualTo("Gale");assertThat(solve(bomb,souvenir,source.getId(),"contestantScore",List.of("46","47","48","49"),false)).isEqualTo(new SouvenirOutput("47",2));assertThat(solve(bomb,souvenir,source.getId(),"What was the bomb's score in Schlag den Bomb?",List.of("70","71","72","73","74","75"),false)).isEqualTo(new SouvenirOutput("73",4));}

	@Test void resolvesMahjongCountingTile(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.MAHJONG,true,Map.of("mahjongCountingTile","Spring"));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"countingTile",List.of(),false).answer()).isEqualTo("Spring");assertThat(solve(bomb,souvenir,source.getId(),"Which tile was shown in the bottom-left of Mahjong?",List.of("Plum","Orchid","Spring","Winter","North","East"),false)).isEqualTo(new SouvenirOutput("Spring",3));}

	@Test void resolvesBothKudosudokuPrefilledArguments(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.KUDOSUDOKU,true,Map.of("kudosudokuPrefilledCoordinates",List.of("A1","B2","C3","D4","A4","C4")));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"prefilled",List.of(),false).answer()).contains("A1").contains("C4");assertThat(solve(bomb,souvenir,source.getId(),"not prefilled",List.of(),false).answer()).contains("B4").doesNotContain("A1");assertThat(solve(bomb,souvenir,source.getId(),"Which square was pre-filled in Kudosudoku?",List.of("D1","B2","A2","C2","D2","B3"),false)).isEqualTo(new SouvenirOutput("B2",2));assertThat(solve(bomb,souvenir,source.getId(),"Which square was not pre-filled in Kudosudoku?",List.of("A1","B2","C3","D4","A4","B4"),false)).isEqualTo(new SouvenirOutput("B4",6));}

	@Test void resolvesAllThreeChallengeAndContactDisplayedLetters(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.CHALLENGE_AND_CONTACT,true,Map.of("challengeAndContactDisplayedLetters",List.of("X","Z","P")));bomb.setModules(List.of(souvenir,source));List<String>answers=List.of("A","P","X","Z","M","Q");for(int i=0;i<3;i++){String ordinal=List.of("first","second","third").get(i),expected=List.of("X","Z","P").get(i);assertThat(solve(bomb,souvenir,source.getId(),"letter "+ordinal,List.of(),false).answer()).isEqualTo(expected);assertThat(solve(bomb,souvenir,source.getId(),"What was the "+ordinal+" displayed letter in Challenge & Contact?",answers,false).answer()).isEqualTo(expected);}}
	@Test void resolvesCursedDoubleOhInitialFirstDigit(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.CURSED_DOUBLE_OH,true,Map.of("cursedDoubleOhInitialFirstDigit","8"));bomb.setModules(List.of(souvenir,source));List<String>answers=List.of("0","2","4","6","8","9");assertThat(solve(bomb,souvenir,source.getId(),"initialFirstDigit",List.of(),false).answer()).isEqualTo("8");assertThat(solve(bomb,souvenir,source.getId(),"What was the first digit of the initially displayed number in Cursed Double-Oh?",answers,false).answerIndex()).isEqualTo(5);}
	@Test void resolvesEveryTenButtonColorCodeInitialColor(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());List<List<String>>colors=List.of(List.of("red","green","blue","red","green","blue","red","green","blue","red"),List.of("blue","red","green","blue","red","green","blue","red","green","blue"));ModuleEntity source=module(ModuleType.TEN_BUTTON_COLOR_CODE,true,Map.of("tenButtonColorCodeInitialColors",colors));bomb.setModules(List.of(souvenir,source));List<String>ordinals=List.of("first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"),answers=List.of("red","green","blue");for(int stage=0;stage<2;stage++)for(int button=0;button<10;button++){String expected=colors.get(stage).get(button),stageName=ordinals.get(stage),buttonName=ordinals.get(button);assertThat(solve(bomb,souvenir,source.getId(),"color "+buttonName+" "+stageName,List.of(),false).answer()).isEqualTo(expected);assertThat(solve(bomb,souvenir,source.getId(),"What was the initial color of the "+buttonName+" button in the "+stageName+" stage of Ten-Button Color Code?",answers,false).answer()).isEqualTo(expected);}}
	@Test void resolvesThreeLedsInitialStateLayout(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.THREE_LEDS,true,Map.of("threeLedsInitialState","101"));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"initialState",List.of(),false).answer()).isEqualTo("● / ○ ●");assertThat(solve(bomb,souvenir,source.getId(),"What was the initial state of the LEDs in 3 LEDs?",List.of("000","010","101","111"),false)).isEqualTo(new SouvenirOutput("101",3));assertThat(solve(bomb,souvenir,source.getId(),"initial state",List.of("○ / ○ ○","○ / ● ○","● / ○ ●","● / ● ●"),false).answerIndex()).isEqualTo(3);}

	@Test void resolvesAllFunctionsFacts(){BombEntity bomb=new BombEntity();ModuleEntity souvenir=module(ModuleType.SOUVENIR,false,Map.of());ModuleEntity source=module(ModuleType.FUNCTIONS,true,Map.of("functionsFirstQueryLastDigit",7L,"functionsLeftNumber",123,"functionsLetter","Q","functionsRightNumber",456));bomb.setModules(List.of(souvenir,source));assertThat(solve(bomb,souvenir,source.getId(),"first query last digit",List.of(),false).answer()).isEqualTo("7");assertThat(solve(bomb,souvenir,source.getId(),"What number was to the left of the displayed letter in Functions?",List.of("12","123","234","345","456","567"),false).answerIndex()).isEqualTo(2);assertThat(solve(bomb,souvenir,source.getId(),"What letter was displayed in Functions?",List.of("A","F","K","Q","V","Z"),false).answerIndex()).isEqualTo(4);assertThat(solve(bomb,souvenir,source.getId(),"What number was to the right of the displayed letter in Functions?",List.of("123","234","345","456","567","678"),false).answerIndex()).isEqualTo(4);}

	@Test
	void resolvesEverySonicPictureAndMonitorSound() {
		BombEntity bomb = new BombEntity();
		ModuleEntity souvenir = module(ModuleType.SOUVENIR, false, Map.of());
		ModuleEntity sonic = module(ModuleType.SONIC_THE_HEDGEHOG, true, Map.of(
			"sounds", List.of("Boss", "Breathe", "Emerald", "Spring"),
			"pictures", List.of("Buzz Bomber", "Falling Sonic", "Red Spring")
		));
		bomb.setModules(List.of(souvenir, sonic));

		assertThat(solve(bomb, souvenir, sonic.getId(), "firstPicture", List.of(), false))
			.isEqualTo(new SouvenirOutput("Buzz Bomber", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "secondPicture", List.of(), false))
			.isEqualTo(new SouvenirOutput("Falling Sonic", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "thirdPicture", List.of(), false))
			.isEqualTo(new SouvenirOutput("Red Spring", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "runningBootsSound", List.of(), false))
			.isEqualTo(new SouvenirOutput("Boss", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "invincibilitySound", List.of(), false))
			.isEqualTo(new SouvenirOutput("Breathe", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "extraLifeSound", List.of(), false))
			.isEqualTo(new SouvenirOutput("Emerald", null));
		assertThat(solve(bomb, souvenir, sonic.getId(), "ringsSound", List.of(), false))
			.isEqualTo(new SouvenirOutput("Spring", null));
		assertThat(solve(bomb, souvenir, sonic.getId(),
			"What was the third picture on Sonic the Hedgehog?",
			List.of("Blue Lamppost", "Red Lamppost", "Red Spring", "Switch"), false))
			.isEqualTo(new SouvenirOutput("Red Spring", 3));
		assertThat(solve(bomb, souvenir, sonic.getId(),
			"Which sound was played by the Extra Life screen on Sonic the Hedgehog?",
			List.of("Boss", "Breathe", "Emerald", "Spring"), false))
			.isEqualTo(new SouvenirOutput("Emerald", 3));
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
