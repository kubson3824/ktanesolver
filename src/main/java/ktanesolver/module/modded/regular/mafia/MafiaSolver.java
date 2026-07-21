package ktanesolver.module.modded.regular.mafia;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.mafia.MafiaInput.Suspect;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.MAFIA,
	id = "mafia",
	name = "Mafia",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Eliminate the suspects and identify the Godfather.",
	tags = {"names", "elimination", "edgework"}
)
public class MafiaSolver extends AbstractModuleSolver<MafiaInput, MafiaOutput> {
	private static final List<Suspect> ALL = List.of(Suspect.values());
	private static final Set<ModuleType> VANILLA = Set.of(
		ModuleType.BUTTON, ModuleType.CAPACITOR_DISCHARGE, ModuleType.COMPLICATED_WIRES,
		ModuleType.KEYPADS, ModuleType.KNOBS, ModuleType.MAZES, ModuleType.MEMORY,
		ModuleType.MORSE_CODE, ModuleType.PASSWORDS, ModuleType.SIMON_SAYS,
		ModuleType.VENTING_GAS, ModuleType.WHOS_ON_FIRST, ModuleType.WIRE_SEQUENCES, ModuleType.WIRES
	);

	@Override
	protected SolveResult<MafiaOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MafiaInput input) {
		if(input == null || input.suspects() == null || input.suspects().size() != 8
			|| input.suspects().stream().anyMatch(suspect -> suspect == null)
			|| new HashSet<>(input.suspects()).size() != 8) return failure("Select eight different suspects in clockwise order");
		if(!Double.isFinite(input.startingTimeMinutes()) || input.startingTimeMinutes() < 0) return failure("Enter a valid starting time in minutes");
		if(input.additionalPortCount() < 0) return failure("Additional port count cannot be negative");
		if(bomb.getSerialNumber() == null || bomb.getSerialNumber().chars().noneMatch(Character::isDigit)) return failure("The bomb needs a valid serial number");

		Context context = new Context(bomb, input);
		Suspect first = firstMatchingSuspect(bomb.getSerialNumber(), input.suspects());
		List<Suspect> remaining = new ArrayList<>(input.suspects());
		if(bomb.getIndicators().size() >= 2) Collections.reverse(remaining);

		List<Suspect> eliminated = new ArrayList<>();
		int index = remaining.indexOf(first);
		int lastDigit = bomb.getLastDigit();
		while(remaining.size() > 1) {
			eliminated.add(remaining.remove(index));
			index = (index + lastDigit) % remaining.size();
		}

		Suspect lastRemaining = remaining.getFirst();
		Suspect godfather = godfather(lastRemaining, input.suspects(), eliminated, context);
		storeState(module, "players", input.suspects());
		storeState(module, "godfather", godfather);
		return success(new MafiaOutput(godfather, lastRemaining, eliminated));
	}

	private static Suspect firstMatchingSuspect(String serial, List<Suspect> suspects) {
		int sum = serial.toUpperCase(Locale.ROOT).chars()
			.filter(Character::isLetterOrDigit)
			.map(character -> Character.isLetter(character) ? character - 'A' + 1 : character - '0')
			.sum();
		int index = Math.floorMod(sum - 1, ALL.size());
		while(!suspects.contains(ALL.get(index))) index = (index + 1) % ALL.size();
		return ALL.get(index);
	}

	private static Suspect godfather(Suspect suspect, List<Suspect> players, List<Suspect> eliminated, Context c) {
		Suspect sameSide = players.get(players.indexOf(suspect) ^ 1);
		return switch(suspect) {
			case ROB -> c.serialHasAny("AEIOU") ? after(players, suspect, 1) : suspect;
			case TIM -> c.hasAny("Friendship", "Only Connect", "Battleship", "Marble Tumble") ? eliminated.getFirst() : suspect;
			case MARY -> containsAny(players, Suspect.BOB, Suspect.WALTER, Suspect.CHER) ? players.get(players.getFirst() == suspect ? 1 : 0) : suspect;
			case BRIANE -> c.input.hasTwoFactor() || c.bomb.isIndicatorLit("CAR") ? eliminated.getLast() : suspect;
			case HUNTER -> c.portCount > c.bomb.getBatteryCount() ? (players.contains(Suspect.RICK) ? Suspect.RICK : eliminated.get(3)) : suspect;
			case MACY -> players.contains(Suspect.TOMMY) ? Suspect.TOMMY : suspect;
			case JOHN -> players.stream().filter(player -> player.name().startsWith("J")).count() == 1 ? sameSide : suspect;
			case WILL -> (c.bomb.hasPort(PortType.PS2) || c.bomb.hasPort(PortType.DVI)) && c.serialDigits.stream().anyMatch(digit -> digit % 2 == 0) ? eliminated.get(4) : suspect;
			case LACY -> c.hasAny("Boolean Venn Diagram", "Bitwise Operations") || c.contains("logic") ? sameSide : suspect;
			case CLAIRE -> c.moduleCount < 20 ? eliminated.getLast() : suspect;
			case KENNY -> c.bomb.getIndicators().containsValue(false) ? suspect : afterSkipping(players, eliminated.getFirst(), suspect);
			case RICK -> BombEdgeworkUtils.hasEmptyPortPlate(c.bomb) ? after(players, suspect, players.size() - 1) : suspect;
			case WALTER -> c.serialHasAny("WALTER") ? eliminated.getFirst() : suspect;
			case BONNIE -> firstAfter(players, suspect, player -> player.name().startsWith("B"));
			case LUKE -> ALL.stream().filter(player -> player != suspect && players.contains(player)).findFirst().orElseThrow();
			case BILL -> Set.of(0, 2, 3, 5, 7).contains(c.serialDigits.getLast())
				? ALL.reversed().stream().filter(player -> player != suspect && players.contains(player)).findFirst().orElseThrow() : suspect;
			case SARAH -> c.input.hasColoredIndicator() || c.input.hasHdmiPort() || c.serialHasAny("SH3") ? eliminated.getLast() : suspect;
			case LARRY -> c.contains("color") || c.contains("colour") ? suspect : eliminated.getFirst();
			case KATE -> c.serialHasAny("LOST") || c.hasAny("The Swan") ? (players.contains(Suspect.JOHN) ? Suspect.JOHN : sameSide) : suspect;
			case STACY -> c.moduleCount < c.input.startingTimeMinutes() ? eliminated.getFirst() : suspect;
			case DIANE -> c.bomb.hasPort(PortType.USB) || c.input.hasVgaPort() || c.hasAny("The Screw") ? eliminated.getLast() : suspect;
			case MAC -> c.bomb.getPortPlates().stream().anyMatch(plate -> plate.getPorts().containsAll(Set.of(PortType.PARALLEL, PortType.SERIAL))) ? eliminated.get(5) : suspect;
			case JIM -> c.hasAny("Chord Qualities", "Rhythms") || c.contains("piano keys") || c.contains("jukebox") || c.contains("guitar chords") ? sameSide : suspect;
			case CLYDE -> players.contains(Suspect.BONNIE) ? Suspect.BONNIE : suspect;
			case TOMMY -> c.bomb.getBatteryCount() == 0 && c.portCount == 0 ? eliminated.get(3) : suspect;
			case LENNY -> displayName(sameSide).length() == 3 ? suspect : sameSide;
			case MOLLY -> c.hasOtherMModule() ? suspect : after(players, suspect, 1);
			case BENNY -> containsAny(List.of(eliminated.getFirst()), Suspect.HUNTER, Suspect.CHER, Suspect.NICK) ? suspect : after(players, suspect, 3);
			case PHIL -> players.get(4);
			case BOB -> c.hasAny("Laundry", "Morse-A-Maze", "Big Circle", "Painting", "Dr. Doctor", "The Code") || c.bomb.hasIndicator("BOB") ? eliminated.get(2) : suspect;
			case GARY -> c.hasAny("Cheap Checkout", "Ice Cream", "Cooking") ? eliminated.getLast() : suspect;
			case TED -> c.hasAny("Black Hole", "The Sun", "The Moon", "Lightspeed", "Astrology") ? sameSide : suspect;
			case KIM -> eliminated.getFirst().ordinal() < 25 ? eliminated.getFirst() : suspect;
			case NATE -> c.litIndicators > c.unlitIndicators ? after(players, suspect, 1) : suspect;
			case CHER -> c.portCount > 0 && !c.hasNeedyModule ? eliminated.getLast() : suspect;
			case RON -> c.serialLetters.chars().anyMatch(letter -> c.indicatorLetters.indexOf(letter) >= 0) ? sameSide : suspect;
			case THOMAS -> c.contains("maze") ? suspect : after(players, suspect, players.size() - 2);
			case SAM -> c.hasAny("Creation", "The Gamepad", "Minesweeper", "Skewed Slots") ? eliminated.getLast() : suspect;
			case DUKE -> eliminated.getLast().ordinal() >= 25 ? eliminated.getLast() : suspect;
			case JACK -> displayName(sameSide).length() == 4 ? sameSide : suspect;
			case ED -> c.countAnyOrContaining(Set.of("Gridlock", "Human Resources", "Lasers"), "double-oh") == 1 ? eliminated.get(1) : suspect;
			case RONNY -> c.hasVanillaModule && c.portCount < 4 ? suspect : eliminated.getFirst();
			case TERRY -> c.bomb.getBatteryCount() >= 3 ? eliminated.get(2) : suspect;
			case CLAIRA -> c.bomb.getPortPlates().stream().filter(plate -> plate.getPorts().stream().anyMatch(Set.of(PortType.RJ45, PortType.STEREO_RCA, PortType.PS2)::contains)).count() >= 2 ? sameSide : suspect;
			case NICK -> c.hasAny("Zoo", "Nonogram", "Murder", "X01") ? suspect : eliminated.getFirst();
			case COB -> c.hasDuplicateModules ? longestAfter(players, suspect) : suspect;
			case ASH -> c.contains("monsplode") ? eliminated.getLast() : suspect;
			case DON -> suspect;
			case JERRY -> c.hasAny("The Clock", "Rubik's Clock", "The Stopwatch", "Timezone", "The Time Keeper") ? after(players, suspect, players.size() - 1) : suspect;
			case SIMON -> c.contains("simon") ? suspect : sameSide;
		};
	}

	private static boolean containsAny(List<Suspect> players, Suspect... targets) {
		for(Suspect target : targets) if(players.contains(target)) return true;
		return false;
	}

	private static Suspect after(List<Suspect> players, Suspect suspect, int steps) {
		return players.get((players.indexOf(suspect) + steps) % players.size());
	}

	private static Suspect afterSkipping(List<Suspect> players, Suspect suspect, Suspect skip) {
		Suspect next = after(players, suspect, 1);
		return next == skip ? after(players, next, 1) : next;
	}

	private static Suspect firstAfter(List<Suspect> players, Suspect suspect, java.util.function.Predicate<Suspect> predicate) {
		for(int step = 1; step <= players.size(); step++) {
			Suspect candidate = after(players, suspect, step);
			if(predicate.test(candidate)) return candidate;
		}
		throw new IllegalStateException("No matching suspect");
	}

	private static Suspect longestAfter(List<Suspect> players, Suspect suspect) {
		Suspect longest = after(players, suspect, 1);
		for(int step = 2; step < players.size(); step++) {
			Suspect candidate = after(players, suspect, step);
			if(displayName(candidate).length() > displayName(longest).length()) longest = candidate;
		}
		return longest;
	}

	private static String displayName(Suspect suspect) {
		String value = suspect.name().toLowerCase(Locale.ROOT);
		return Character.toUpperCase(value.charAt(0)) + value.substring(1);
	}

	private static String normalize(String value) {
		String normalized = compact(value);
		return normalized.startsWith("the") ? normalized.substring(3) : normalized;
	}

	private static String compact(String value) {
		return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
	}

	private static final class Context {
		private final BombEntity bomb;
		private final MafiaInput input;
		private final List<String> rawModuleNames;
		private final List<String> moduleNames;
		private final List<Integer> serialDigits;
		private final String serialLetters;
		private final String indicatorLetters;
		private final int moduleCount;
		private final int portCount;
		private final long litIndicators;
		private final long unlitIndicators;
		private final boolean hasNeedyModule;
		private final boolean hasVanillaModule;
		private final boolean hasDuplicateModules;

		private Context(BombEntity bomb, MafiaInput input) {
			this.bomb = bomb;
			this.input = input;
			List<String> additional = input.additionalModuleNames() == null ? List.of() : input.additionalModuleNames().stream().filter(name -> name != null && !name.isBlank()).toList();
			this.rawModuleNames = new ArrayList<>(bomb.getModules().stream().map(module -> module.getType().name().replace('_', ' ')).toList());
			this.rawModuleNames.addAll(additional);
			this.moduleNames = rawModuleNames.stream().map(MafiaSolver::normalize).toList();
			this.moduleCount = rawModuleNames.size();
			this.portCount = BombEdgeworkUtils.getTotalPortCount(bomb) + input.additionalPortCount()
				+ (input.hasHdmiPort() ? 1 : 0) + (input.hasVgaPort() ? 1 : 0);
			String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
			this.serialDigits = serial.chars().filter(Character::isDigit).map(character -> character - '0').boxed().toList();
			this.serialLetters = serial.chars().filter(Character::isLetter).collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append).toString();
			this.indicatorLetters = bomb.getIndicators().keySet().stream().map(String::toUpperCase).reduce("", String::concat);
			this.litIndicators = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
			this.unlitIndicators = bomb.getIndicators().size() - litIndicators;
			this.hasNeedyModule = input.hasAdditionalNeedyModule() || bomb.getModules().stream().anyMatch(module -> module.getType().isNeedy());
			this.hasVanillaModule = bomb.getModules().stream().anyMatch(module -> VANILLA.contains(module.getType()));
			List<String> duplicateKeys = rawModuleNames.stream().map(MafiaSolver::compact).toList();
			this.hasDuplicateModules = duplicateKeys.size() != new HashSet<>(duplicateKeys).size();
		}

		private boolean serialHasAny(String characters) {
			return (serialLetters + serialDigits.stream().map(String::valueOf).reduce("", String::concat)).chars().anyMatch(character -> characters.indexOf(character) >= 0);
		}

		private boolean hasAny(String... names) {
			for(String name : names) if(moduleNames.contains(normalize(name))) return true;
			return false;
		}

		private boolean contains(String text) {
			String needle = normalize(text);
			return moduleNames.stream().anyMatch(name -> name.contains(needle));
		}

		private boolean hasOtherMModule() {
			return rawModuleNames.stream().map(name -> name.toLowerCase(Locale.ROOT).trim())
				.anyMatch(name -> !normalize(name).equals("mafia") && (name.startsWith("m") || name.startsWith("the m")));
		}

		private long countAnyOrContaining(Set<String> exact, String contained) {
			Set<String> normalizedExact = exact.stream().map(MafiaSolver::normalize).collect(java.util.stream.Collectors.toSet());
			String needle = normalize(contained);
			return moduleNames.stream().filter(name -> normalizedExact.contains(name) || name.contains(needle)).count();
		}
	}
}
