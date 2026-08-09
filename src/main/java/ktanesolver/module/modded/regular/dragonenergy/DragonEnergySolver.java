package ktanesolver.module.modded.regular.dragonenergy;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
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
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.DRAGON_ENERGY,
	id = "dragonEnergy",
	name = "Dragon Energy",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply the Venn-diagram swaps and submit a safe translated word at an allowed timer digit.",
	tags = {"mandarin", "venn", "words", "timer"}
)
public class DragonEnergySolver extends AbstractModuleSolver<DragonEnergyInput, DragonEnergyOutput> {
	public static final List<String> WORDS = List.of(
		"Angry", "Blessing", "Child", "Curse", "Heaven", "Happiness", "Dragon", "Dream", "Energy", "Female",
		"Force", "Forest", "Friend", "Hate", "Hope", "Kindness", "Longevity", "Love", "Loyal", "Spirit",
		"Male", "Mountain", "Night", "Pure", "Heart", "River", "Emotion", "Soul", "Urgency", "Wind"
	);
	private static final List<String> CIRCLES = List.of(
		"G", "P", "R", "C", "GPR", "GRC", "RCP", "CR", "GR", "CP", "GPRC", "P", "GP", "GP", "G",
		"GPC", "CP", "CP", "GR", "CR", "GPRC", "GR", "R", "GP", "CR", "C", "C", "P", "R", "G"
	);
	private static final Set<String> NEVER_IF_SWAPPED = Set.of(
		"Friend", "Child", "Soul", "River", "Wind", "Blessing", "Longevity", "Energy", "Spirit"
	);
	private static final List<String> COLORS = List.of("ORANGE", "CYAN", "PURPLE");
	private static final String[][][] BAD = {
		{{"0159", "0346", "0278"}, {"01236", "02567", "1347"}, {"3479", "5689", "0129"}},
		{{"02468", "346", "0278"}, {"13579", "589", "1347"}, {"012345", "5689", "012"}},
		{{"012789", "0124578", "012345678"}, {"45678", "04679", "012345789"}, {"134679", "04567", "123456789"}}
	};

	@Override
	protected SolveResult<DragonEnergyOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, DragonEnergyInput input
	) {
		if (input == null || input.displayedWords() == null || input.displayedWords().size() != 3)
			return failure("Enter the three translated words");
		if (bomb.getSerialNumber() == null) return failure("Bomb serial number is required");
		List<String> displayed = input.displayedWords().stream().map(DragonEnergySolver::word).toList();
		if (displayed.stream().anyMatch(String::isEmpty) || new HashSet<>(displayed).size() != 3)
			return failure("Displayed words must be three distinct words from the manual");
		String color = input.indicatorColor() == null ? "" : input.indicatorColor().trim().toUpperCase(Locale.ROOT);
		int colorIndex = COLORS.indexOf(color);
		if (colorIndex < 0) return failure("Indicator color must be orange, cyan, or purple");

		List<MutableWord> words = initialWords();
		int scenario = scenario(bomb);
		applyScenario(words, scenario, bomb.getLastDigit());
		List<MutableWord> shown = displayed.stream().map(name -> find(words, name)).toList();
		Set<String> correct = correctWords(words, shown);
		correct.removeIf(name -> {
			MutableWord candidate = find(words, name);
			return NEVER_IF_SWAPPED.contains(name) && candidate.swaps > 0;
		});
		if (correct.isEmpty()) return failure("No safe word remains; check the displayed translations and edgework");

		int relation = Integer.compare(bomb.getBatteryHolders(), bomb.getPortPlates().size());
		int relationIndex = relation == 0 ? 0 : relation > 0 ? 1 : 2;
		List<Integer> safe = safeDigits(relationIndex, colorIndex, bomb.getStrikes());
		storeState(module, "indicatorColor", title(color));
		return success(new DragonEnergyOutput(new ArrayList<>(correct), safe, scenario));
	}

	static int scenario(BombEntity bomb) {
		long vowels = bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().filter(value -> "AEIOU".indexOf(value) >= 0).count();
		if (bomb.getBatteryCount() > 10 && (bomb.getLastDigit() == 5 || bomb.getLastDigit() == 7)) return 1;
		if (bomb.getPortPlates().size() > bomb.getBatteryHolders() && bomb.getModules().stream()
			.anyMatch(module -> module.getType() == ModuleType.MORSE_WAR || module.getType() == ModuleType.DOUBLE_COLOR)) return 2;
		long unlit = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		if ((bomb.isIndicatorLit("SIG") && bomb.isIndicatorLit("FRK")) || unlit == 3) return 3;
		if (bomb.getModules().size() > 8) return 4;
		if (vowels >= 2) return 5;
		if (bomb.getModules().stream().noneMatch(ModuleEntity::isSolved)) return 6;
		return 7;
	}

	static List<Integer> safeDigits(int relation, int color, int strikes) {
		String bad = BAD[relation][color][Math.min(strikes, 2)];
		return java.util.stream.IntStream.range(0, 10).filter(digit -> bad.indexOf((char) ('0' + digit)) < 0).boxed().toList();
	}

	private static Set<String> correctWords(List<MutableWord> words, List<MutableWord> shown) {
		Set<Character> common = primaries(shown.get(0).circle);
		common.retainAll(primaries(shown.get(1).circle)); common.retainAll(primaries(shown.get(2).circle));
		LinkedHashSet<String> answer = new LinkedHashSet<>();
		if (!common.isEmpty()) {
			for (MutableWord word : words) if (primaries(word.circle).stream().anyMatch(common::contains)) answer.add(word.name);
			return answer;
		}
		boolean sameSecondary = false;
		for (int a = 0; a < 3; a++) for (int b = a + 1; b < 3; b++)
			if (shown.get(a).circle.length() == 2 && shown.get(a).circle.equals(shown.get(b).circle)) sameSecondary = true;
		if (sameSecondary) for (MutableWord word : words) { if (word.circle.length() == 2) answer.add(word.name); }
		else {
			boolean noShared = true;
			for (int a = 0; a < 3; a++) for (int b = a + 1; b < 3; b++) {
				Set<Character> intersection = primaries(shown.get(a).circle); intersection.retainAll(primaries(shown.get(b).circle));
				if (!intersection.isEmpty()) noShared = false;
			}
			int length = noShared ? 4 : 3;
			for (MutableWord word : words) if (word.circle.length() == length) answer.add(word.name);
		}
		return answer;
	}

	private static void applyScenario(List<MutableWord> words, int scenario, int lastDigit) {
		switch (scenario) {
			case 1 -> { swapSet(words, "GP", "G"); swapSet(words, "GR", "R"); swapSet(words, "CR", "C"); swapSet(words, "P", "CP"); }
			case 2 -> { swapSet(words, "CR", "GP"); swapSet(words, "GR", "CP"); }
			case 3 -> { swapSet(words, "GP", "C"); swapSet(words, "GR", "P"); swapSet(words, "CR", "G"); swapSet(words, "R", "CP"); }
			case 4 -> { swapSet(words, "GPR", "GRC"); swapSet(words, "GPC", "RCP"); swapSet(words, "GR", "GPRC"); swapSet(words, "P", "C"); }
			case 5 -> { swapSet(words, "G", "R"); swapSet(words, "CP", "GPRC"); swapSet(words, "C", "CR"); }
			case 6 -> { swapSet(words, "GP", "GPRC"); swapWords(find(words, "Urgency"), find(words, "River")); }
			case 7 -> {
				swapWords(find(words, "Wind"), find(words, "Forest")); swapWords(find(words, "Heaven"), find(words, "Spirit"));
				swapWords(find(words, "Longevity"), find(words, "Mountain")); swapWords(find(words, "Hope"), find(words, "Force"));
				if (lastDigit >= 1 && lastDigit <= 6) applyScenario(words, lastDigit, lastDigit);
			}
			default -> throw new IllegalArgumentException("Swap scenario must be 1–7");
		}
	}

	private static void swapSet(List<MutableWord> words, String first, String second) {
		List<MutableWord> one = words.stream().filter(word -> word.circle.equals(first)).toList();
		List<MutableWord> two = words.stream().filter(word -> word.circle.equals(second)).toList();
		int shared = Math.min(one.size(), two.size());
		for (int i = 0; i < shared; i++) swapWords(one.get(i), two.get(i));
		if (one.size() > two.size()) { one.get(one.size() - 1).circle = one.get(0).circle; one.get(one.size() - 1).swaps++; }
		if (two.size() > one.size()) { two.get(two.size() - 1).circle = two.get(0).circle; two.get(two.size() - 1).swaps++; }
	}

	private static void swapWords(MutableWord one, MutableWord two) {
		String circle = one.circle; one.circle = two.circle; two.circle = circle; one.swaps++; two.swaps++;
	}

	private static List<MutableWord> initialWords() {
		List<MutableWord> words = new ArrayList<>();
		for (int i = 0; i < WORDS.size(); i++) words.add(new MutableWord(WORDS.get(i), CIRCLES.get(i)));
		return words;
	}

	private static MutableWord find(List<MutableWord> words, String name) {
		return words.stream().filter(word -> word.name.equals(name)).findFirst().orElseThrow();
	}

	private static Set<Character> primaries(String circle) {
		Set<Character> result = new HashSet<>(); for (char value : circle.toCharArray()) result.add(value); return result;
	}

	private static String word(String value) {
		if (value == null) return "";
		return WORDS.stream().filter(candidate -> candidate.equalsIgnoreCase(value.trim())).findFirst().orElse("");
	}

	private static String title(String value) { return value.charAt(0) + value.substring(1).toLowerCase(Locale.ROOT); }
	private static final class MutableWord { private final String name; private String circle; private int swaps; private MutableWord(String name, String circle) { this.name = name; this.circle = circle; } }
}
