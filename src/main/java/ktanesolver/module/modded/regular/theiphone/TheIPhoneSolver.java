package ktanesolver.module.modded.regular.theiphone;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.theiphone.TheIPhoneInput.Message;
import ktanesolver.module.modded.regular.theiphone.TheIPhoneInput.TinderProfile;

@Service
@ModuleInfo(
	type = ModuleType.THE_IPHONE,
	id = "iPhone",
	name = "The iPhone",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Solve the phone apps and assemble the four-digit factory-reset PIN",
	tags = {"apps", "stages", "PIN", "Souvenir"}
)
public class TheIPhoneSolver extends AbstractModuleSolver<TheIPhoneInput, TheIPhoneOutput> {
	private static final Set<String> CHARACTERS = Set.of(
		"RED_ANGRY_BIRD", "YELLOW_ANGRY_BIRD", "BLUE_ANGRY_BIRD", "WHITE_ANGRY_BIRD", "BLACK_ANGRY_BIRD",
		"REGULAR_PIG", "HELMET_PIG", "MOUSTACHED_PIG", "KING_PIG", "BLACK_EYED_PIG"
	);
	private static final Set<String> PEOPLE = Set.of("PHIL", "ROB", "MICK", "ANDY");
	private static final Set<String> STAR_SIGNS = Set.of("VIRGO", "LEO", "SCORPIO", "CAPRICORN", "CANCER", "GEMINI");
	private static final Set<String> HOBBIES = Set.of("BADMINTON", "GOLF", "CINEMA", "THEATRE", "DANCING", "CLUBBING");
	private static final Set<String> PETS = Set.of("CAT", "DOG", "GOLDFISH", "GERBIL", "HAMSTER");
	private static final String[][] ANGRY_BIRD_RESULTS = {
		{"TOP_RIGHT", "TOP_LEFT", "BOTTOM_LEFT", "BOTTOM_RIGHT"},
		{"BOTTOM_LEFT", "TOP_RIGHT", "BOTTOM_RIGHT", "TOP_LEFT"},
		{"TOP_LEFT", "BOTTOM_RIGHT", "TOP_RIGHT", "BOTTOM_LEFT"},
		{"BOTTOM_LEFT", "TOP_RIGHT", "TOP_LEFT", "BOTTOM_RIGHT"},
		{"BOTTOM_RIGHT", "BOTTOM_LEFT", "TOP_RIGHT", "TOP_LEFT"},
		{"TOP_RIGHT", "TOP_LEFT", "BOTTOM_RIGHT", "BOTTOM_LEFT"},
		{"TOP_LEFT", "BOTTOM_LEFT", "BOTTOM_RIGHT", "TOP_RIGHT"},
		{"BOTTOM_LEFT", "TOP_RIGHT", "TOP_LEFT", "BOTTOM_RIGHT"},
		{"TOP_RIGHT", "BOTTOM_RIGHT", "BOTTOM_LEFT", "TOP_LEFT"}
	};

	@Override
	protected SolveResult<TheIPhoneOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheIPhoneInput input
	) {
		if (input == null || input.action() == null) return failure("Select an iPhone app or action");
		IPhoneState stored = module.getStateAs(IPhoneState.class, IPhoneState::empty);
		List<Integer> pinDigits = new ArrayList<>(stored.pinDigits());
		int tinderProgress = stored.tinderProgress();
		String instruction;
		String press = null;
		String swipe = null;
		Integer score = null;

		switch (input.action()) {
			case ANGRY_BIRDS -> {
				if (input.characters() == null || input.characters().size() != 4 || !CHARACTERS.containsAll(input.characters())) {
					return failure("Select all four Angry Birds characters in position order");
				}
				press = angryBirdsPress(input.characters(), bomb.getBatteryCount(), bomb.getIndicators().size());
				instruction = "Press " + press.replace('_', ' ').toLowerCase() + ", then record the digit in the center star";
			}
			case MESSAGES -> {
				if (!validMessages(input.messages())) return failure("Enter one valid message style and digit for each person");
				List<Message> truthful = input.messages().stream().filter(message -> message.sender().equals(message.style())).toList();
				if (truthful.size() != 1) return failure("Exactly one message must use its sender's own phrasing style");
				pinDigits.set(1, truthful.get(0).digit());
				instruction = truthful.get(0).sender().toLowerCase() + " is telling the truth; the second PIN digit is " + truthful.get(0).digit();
			}
			case PHOTOS -> {
				if (input.photoDigit() == null || input.photoDigit() < 0 || input.photoDigit() > 9) return failure("Select the unique manual photo");
				pinDigits.set(2, input.photoDigit());
				instruction = "The third PIN digit is " + input.photoDigit();
			}
			case TINDER -> {
				if (!validProfile(input.tinder())) return failure("Enter a valid Tinder profile");
				score = tinderScore(input.tinder(), bomb.getStrikes());
				swipe = score > 0 || score == 0 && input.tinder().name().trim().length() >= 5 ? "RIGHT" : "LEFT";
				tinderProgress = Math.min(3, tinderProgress + 1);
				instruction = "Swipe " + swipe.toLowerCase() + (tinderProgress == 3
					? "; record the revealed fourth PIN digit" : "; then enter the next profile");
			}
			case RECORD_DIGIT -> {
				if (input.pinPosition() == null || input.pinDigit() == null
					|| input.pinPosition() != 1 && input.pinPosition() != 4 || input.pinDigit() < 0 || input.pinDigit() > 9) {
					return failure("Record a single digit for Angry Birds or Tinder");
				}
				pinDigits.set(input.pinPosition() - 1, input.pinDigit());
				instruction = "Recorded PIN digit " + input.pinPosition();
			}
			case RESET_TINDER -> {
				tinderProgress = 0;
				instruction = "Tinder progress reset";
			}
			case CHEAT_CODES -> instruction = "Dial a code and press #; every attempt causes a strike";
			default -> throw new IllegalStateException("Unexpected action: " + input.action());
		}

		storeTypedState(module, new IPhoneState(pinDigits, tinderProgress));
		String pin = pinDigits.stream().allMatch(java.util.Objects::nonNull)
			? pinDigits.stream().map(String::valueOf).reduce("", String::concat) : null;
		if (pin != null) instruction = "Enter " + pin + " in Settings";
		TheIPhoneOutput output = new TheIPhoneOutput(
			instruction, pinDigits, press, swipe, score, tinderProgress, pin,
			cheatCodes(bomb.getSerialNumber() != null && bomb.serialHasVowel())
		);
		return success(output, pin != null);
	}

	private static boolean validMessages(List<Message> messages) {
		return messages != null && messages.size() == 4
			&& messages.stream().allMatch(message -> message != null && PEOPLE.contains(message.sender())
				&& PEOPLE.contains(message.style()) && message.digit() >= 0 && message.digit() <= 9)
			&& messages.stream().map(Message::sender).collect(java.util.stream.Collectors.toSet()).equals(PEOPLE);
	}

	private static boolean validProfile(TinderProfile profile) {
		return profile != null && profile.name() != null && !profile.name().isBlank() && profile.age() >= 18
			&& STAR_SIGNS.contains(profile.starSign()) && HOBBIES.contains(profile.hobby()) && PETS.contains(profile.pet());
	}

	static String angryBirdsPress(List<String> characters, int batteries, int indicators) {
		long birds = characters.stream().filter(character -> character.endsWith("BIRD")).count();
		int group = birds > 2 ? 0 : birds < 2 ? 1 : 2;
		int edgework = batteries >= 3 ? 0 : indicators >= 3 ? 1 : 2;
		int rule;
		if (group == 0) {
			rule = yellowAbovePig(characters) ? 0 : blackRightOfRed(characters) ? 1 : characters.contains("WHITE_ANGRY_BIRD") ? 2 : 3;
		} else if (group == 1) {
			rule = new HashSet<>(characters).size() == 4 ? 0 : !characters.contains("KING_PIG") ? 1 : specialPigLeftOfBird(characters) ? 2 : 3;
		} else {
			rule = regularPigAndWhiteOrBlueOnTop(characters) ? 0 : redOrBlackBelowPig(characters) ? 1
				: new HashSet<>(characters).size() == 4 ? 2 : 3;
		}
		return ANGRY_BIRD_RESULTS[group * 3 + edgework][rule];
	}

	private static boolean yellowAbovePig(List<String> c) {
		return c.get(0).equals("YELLOW_ANGRY_BIRD") && isPig(c.get(2)) || c.get(1).equals("YELLOW_ANGRY_BIRD") && isPig(c.get(3));
	}

	private static boolean blackRightOfRed(List<String> c) {
		return c.get(0).equals("RED_ANGRY_BIRD") && c.get(1).equals("BLACK_ANGRY_BIRD")
			|| c.get(2).equals("RED_ANGRY_BIRD") && c.get(3).equals("BLACK_ANGRY_BIRD");
	}

	private static boolean specialPigLeftOfBird(List<String> c) {
		return isSpecialPig(c.get(0)) && c.get(1).endsWith("BIRD") || isSpecialPig(c.get(2)) && c.get(3).endsWith("BIRD");
	}

	private static boolean regularPigAndWhiteOrBlueOnTop(List<String> c) {
		return c.subList(0, 2).contains("REGULAR_PIG")
			&& (c.subList(0, 2).contains("WHITE_ANGRY_BIRD") || c.subList(0, 2).contains("BLUE_ANGRY_BIRD"));
	}

	private static boolean redOrBlackBelowPig(List<String> c) {
		return isPig(c.get(0)) && isRedOrBlackBird(c.get(2)) || isPig(c.get(1)) && isRedOrBlackBird(c.get(3));
	}

	private static boolean isPig(String character) { return character.endsWith("PIG"); }
	private static boolean isSpecialPig(String character) { return character.equals("HELMET_PIG") || character.equals("MOUSTACHED_PIG"); }
	private static boolean isRedOrBlackBird(String character) { return character.equals("RED_ANGRY_BIRD") || character.equals("BLACK_ANGRY_BIRD"); }

	static int tinderScore(TinderProfile profile, int strikes) {
		int column = Math.min(strikes, 2);
		int ageRow = profile.age() <= 22 ? 0 : profile.age() <= 28 ? 1 : profile.age() <= 35 ? 2 : profile.age() <= 41 ? 3 : 4;
		int score = new int[][] {{3, -2, -1}, {2, -1, -1}, {1, 3, -2}, {-1, 2, 3}, {-2, -1, 2}}[ageRow][column];
		score += Map.of(
			"VIRGO", new int[] {2, 1, 1}, "LEO", new int[] {2, 2, -1}, "SCORPIO", new int[] {-2, -1, 1},
			"CAPRICORN", new int[] {-2, -2, -1}, "CANCER", new int[] {1, 2, 1}, "GEMINI", new int[] {-1, -1, -1}
		).get(profile.starSign())[column];
		score += Map.of(
			"BADMINTON", new int[] {1, 2, -1}, "GOLF", new int[] {-1, 1, 1}, "CINEMA", new int[] {1, -1, -2},
			"THEATRE", new int[] {-2, 1, 2}, "DANCING", new int[] {-3, -2, 3}, "CLUBBING", new int[] {2, -2, -3}
		).get(profile.hobby())[column];
		score += Map.of(
			"CAT", new int[] {3, 1, -1}, "DOG", new int[] {2, -3, -2}, "GOLDFISH", new int[] {-1, 1, 2},
			"GERBIL", new int[] {-2, 2, -2}, "HAMSTER", new int[] {-2, -2, 3}
		).get(profile.pet())[column];
		return score;
	}

	private static Map<String, String> cheatCodes(boolean serialHasVowel) {
		return serialHasVowel
			? Map.of("Angry Birds", "52716#", "Messages", "60138#", "Photos", "81606#", "Tinder", "30962#")
			: Map.of("Angry Birds", "43892#", "Messages", "15397#", "Photos", "79431#", "Tinder", "21486#");
	}

	private record IPhoneState(List<Integer> pinDigits, int tinderProgress) {
		private static IPhoneState empty() {
			return new IPhoneState(new ArrayList<>(Arrays.asList(null, null, null, null)), 0);
		}
	}
}
