package ktanesolver.enums;

import lombok.Getter;

@Getter
public enum ModuleType {
	IDENTITY_PARADE(false), MAFIA(false), PAINTING(false), JUKEBOX(false),
	WIRES(false), BUTTON(false), KEYPADS(false), MEMORY(false), SIMON_SAYS(false), MORSE_CODE(false), FORGET_ME_NOT(false), SOUVENIR(false), ICE_CREAM(false), THE_SCREW(false), YAHTZEE(false), X_RAY(false), BATTLESHIP(false), MINESWEEPER(false), VISUAL_IMPAIRMENT(false), WHOS_ON_FIRST(false), THIRD_BASE(false), VENTING_GAS(true), CAPACITOR_DISCHARGE(
		true), COMPLICATED_WIRES(false), WIRE_SEQUENCES(false), PASSWORDS(false), EXTENDED_PASSWORD(false), MAZES(false), KNOBS(true), COLOR_FLASH(false), PIANO_KEYS(false), SEMAPHORE(false), PERSPECTIVE_PEGS(false), EMOJI_MATH(
	false), SWITCHES(false), COLORED_SWITCHES(false), TWO_BITS(false), WORD_SCRAMBLE(false), WORD_SEARCH(false), BROKEN_BUTTONS(false), COMPLICATED_BUTTONS(false), ANAGRAMS(false), COMBINATION_LOCK(false), ROUND_KEYPAD(false), NUMBER_PAD(false), LISTENING(false), FOREIGN_EXCHANGE_RATES(false), ORIENTATION_CUBE(false), MORSEMATICS(false), CONNECTION_CHECK(false), LETTER_KEYS(false), LOGIC(false), ASTROLOGY(false), MYSTIC_SQUARE(false), CRAZY_TALK(false), ADVENTURE_GAME(false), PLUMBING(false), CRUEL_PIANO_KEYS(false), FESTIVE_PIANO_KEYS(false), FLAGS(false), TIMEZONE(false), POLYHEDRAL_MAZE(false), SAFETY_SAFE(false), CRYPTOGRAPHY(false), CAESAR_CIPHER(false), TURN_THE_KEY(false), TURN_THE_KEYS(false), CHESS(false), MOUSE_IN_THE_MAZE(false), MORSE_A_MAZE(false), HEXAMAZE(false), BLIND_MAZE(false), BITMAPS(false), BRAILLE(false), COLORED_SQUARES(false), ADJACENT_LETTERS(false), SILLY_SLOTS(false), SKEWED_SLOTS(false), THREE_D_MAZE(false), SIMON_STATES(false), SIMON_SCREAMS(false), MODULES_AGAINST_HUMANITY(false), LAUNDRY(false), PROBING(false), ALPHABET(false), MICROCONTROLLER(false), MURDER(false), RESISTORS(false), GAMEPAD(false), TIC_TAC_TOE(false), MONSPLODE_FIGHT(false), MONSPLODE_TRADING_CARDS(false), GAME_OF_LIFE_SIMPLE(false), GAME_OF_LIFE_CRUEL(false), SHAPE_SHIFT(false), FOLLOW_THE_LEADER(false), FRIENDSHIP(false), THE_BULB(false), BLIND_ALLEY(false), SEA_SHELLS(false), ENGLISH_TEST(false), ROCK_PAPER_SCISSORS_LIZARD_SPOCK(false), SQUARE_BUTTON(false), TEXT_FIELD(false), SYMBOLIC_PASSWORD(false), WIRE_PLACEMENT(false), PERPLEXING_WIRES(false), DOUBLE_OH(false), CHEAP_CHECKOUT(false), COORDINATES(false), LIGHT_CYCLE(false), SYMBOL_CYCLE(false), BINARY_LEDS(false), RHYTHMS(false), COLOR_MATH(false), COLOR_MORSE(false), COLOR_GENERATOR(false), BIG_CIRCLE(false), MASTERMIND_SIMPLE(false), MASTERMIND_CRUEL(false), GRIDLOCK(false), ONLY_CONNECT(false), NEUTRALIZATION(false), WEB_DESIGN(false), CHORD_QUALITIES(false), CREATION(false), RUBIKS_CUBE(false), FIZZ_BUZZ(false), THE_CLOCK(false), LED_ENCRYPTION(false), BITWISE_OPERATIONS(false), FAST_MATH(false), BOOLEAN_VENN_DIAGRAM(false), ZOO(false), POINT_OF_ORDER(false), NONOGRAM(false), SET(false), HUNTING(false), CURRICULUM(false), MAINTENANCE(false), BACKGROUNDS(false), FAULTY_BACKGROUNDS(false), MORTAL_KOMBAT(false), MASHEMATICS(false), RADIATOR(false);

	private final boolean needy;

	ModuleType(boolean needy) {
		this.needy = needy;
	}

}
