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
