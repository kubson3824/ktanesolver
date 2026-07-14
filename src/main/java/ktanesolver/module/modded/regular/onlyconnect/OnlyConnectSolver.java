package ktanesolver.module.modded.regular.onlyconnect;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
import ktanesolver.module.modded.regular.onlyconnect.OnlyConnectOutput.Group;

@Service
@ModuleInfo(
	type = ModuleType.ONLY_CONNECT,
	id = "only-connect",
	name = "Only Connect",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the odd Egyptian hieroglyph, then partition the connecting wall by language.",
	tags = {"modded", "hieroglyphs", "languages", "edgework", "multi-stage"}
)
public class OnlyConnectSolver extends AbstractModuleSolver<OnlyConnectInput, OnlyConnectOutput> {
	private static final List<String> HIEROGLYPHS = List.of(
		"Two Reeds", "Lion", "Twisted Flax", "Horned Viper", "Water", "Eye of Horus"
	);
	private static final List<PortType> PORTS = List.of(
		PortType.PS2, PortType.PARALLEL, PortType.RJ45, PortType.STEREO_RCA, PortType.SERIAL, PortType.DVI
	);
	private static final Map<String, Set<String>> ALPHABETS = alphabets();

	@Override
	protected SolveResult<OnlyConnectOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, OnlyConnectInput input
	) {
		if (input == null || input.round() < 1 || input.round() > 2) return failure("Select round 1 or round 2");
		return input.round() == 1 ? solveHieroglyphs(bomb, module, input) : solveWall(module, input);
	}

	private SolveResult<OnlyConnectOutput> solveHieroglyphs(BombEntity bomb, ModuleEntity module, OnlyConnectInput input) {
		if (input.teamName() == null || input.teamName().isBlank()) return failure("Enter the displayed team name");
		if (bomb.getSerialNumber() == null || bomb.getSerialNumber().length() != 6) return failure("The bomb needs a six-character serial number");
		List<String> displayed = normalizeHieroglyphs(input.hieroglyphs());
		if (displayed == null) return failure("Place each of the six hieroglyphs exactly once");

		String team = input.teamName().trim().toUpperCase(Locale.ROOT);
		String serial = bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		int[] matches = new int[6];
		for (int glyph = 0; glyph < 6; glyph++) {
			if (displayed.get(glyph).equals(HIEROGLYPHS.get(glyph))) matches[glyph]++;
			char serialCharacter = serial.charAt(glyph);
			if (Character.isDigit(serialCharacter)) serialCharacter = serialCharacter == '0' ? 'Z' : (char) ('A' + serialCharacter - '1');
			if (team.indexOf(serialCharacter) >= 0) matches[glyph]++;
			if (bomb.hasPort(PORTS.get(glyph))) matches[glyph]++;
		}

		Map<Integer, Integer> frequencies = new HashMap<>();
		for (int count : matches) frequencies.merge(count, 1, Integer::sum);
		List<Integer> answers = new ArrayList<>();
		for (int glyph = 0; glyph < 6; glyph++) if (frequencies.get(matches[glyph]) == 1) answers.add(glyph);
		if (answers.size() != 1) return failure("These details do not produce exactly one odd hieroglyph; check the team name and positions");

		int glyph = answers.getFirst();
		int position = displayed.indexOf(HIEROGLYPHS.get(glyph)) + 1;
		storeState(module, Map.of("hieroglyphs", displayed, "teamName", team));
		return success(new OnlyConnectOutput(1, HIEROGLYPHS.get(glyph), position, List.of()), false);
	}

	private SolveResult<OnlyConnectOutput> solveWall(ModuleEntity module, OnlyConnectInput input) {
		if (!module.getState().containsKey("hieroglyphs")) return failure("Solve round 1 before entering the connecting wall");
		List<String> letters = normalizeLetters(input.letters());
		if (letters == null) return failure("Enter nine different single letters");

		List<Candidate> candidates = candidates(letters);
		Map<String, List<Candidate>> solutions = new LinkedHashMap<>();
		findSolutions((1 << 9) - 1, candidates, new HashSet<>(), new ArrayList<>(), solutions);
		if (solutions.size() != 1) return failure(solutions.isEmpty()
			? "The letters cannot be divided into three language groups"
			: "The letters have more than one grouping; check the wall");

		List<Group> groups = solutions.values().iterator().next().stream().map(candidate -> new Group(
			candidate.language(), bits(candidate.mask(), letters)
		)).toList();
		storeState(module, "wall", letters);
		return success(new OnlyConnectOutput(2, null, null, groups));
	}

	private static List<String> normalizeHieroglyphs(List<String> values) {
		if (values == null || values.size() != 6) return null;
		List<String> result = values.stream().map(value -> value == null ? "" : value.trim()).map(value -> HIEROGLYPHS.stream()
			.filter(name -> name.equalsIgnoreCase(value)).findFirst().orElse("")).toList();
		return new HashSet<>(result).size() == 6 ? result : null;
	}

	private static List<String> normalizeLetters(List<String> values) {
		if (values == null || values.size() != 9) return null;
		List<String> result = values.stream().map(value -> value == null ? "" : value.trim().toLowerCase(Locale.ROOT))
			.filter(value -> value.codePointCount(0, value.length()) == 1).toList();
		return result.size() == 9 && new HashSet<>(result).size() == 9 ? result : null;
	}

	private static List<Candidate> candidates(List<String> letters) {
		List<Candidate> result = new ArrayList<>();
		for (Map.Entry<String, Set<String>> alphabet : ALPHABETS.entrySet()) {
			for (int a = 0; a < 7; a++) for (int b = a + 1; b < 8; b++) for (int c = b + 1; c < 9; c++) {
				if (alphabet.getValue().contains(letters.get(a)) && alphabet.getValue().contains(letters.get(b)) && alphabet.getValue().contains(letters.get(c))) {
					result.add(new Candidate(alphabet.getKey(), (1 << a) | (1 << b) | (1 << c)));
				}
			}
		}
		return result;
	}

	private static void findSolutions(
		int remaining, List<Candidate> candidates, Set<String> languages, List<Candidate> chosen,
		Map<String, List<Candidate>> solutions
	) {
		if (solutions.size() > 1) return;
		if (remaining == 0) {
			if (chosen.size() == 3) {
				String key = chosen.stream().map(Candidate::mask).sorted().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
				solutions.putIfAbsent(key, List.copyOf(chosen));
			}
			return;
		}
		if (chosen.size() == 3) return;
		int first = Integer.lowestOneBit(remaining);
		for (Candidate candidate : candidates) {
			if ((candidate.mask() & first) == 0 || (candidate.mask() & remaining) != candidate.mask() || languages.contains(candidate.language())) continue;
			chosen.add(candidate);
			languages.add(candidate.language());
			findSolutions(remaining ^ candidate.mask(), candidates, languages, chosen, solutions);
			languages.remove(candidate.language());
			chosen.removeLast();
		}
	}

	private static List<String> bits(int mask, List<String> letters) {
		List<String> result = new ArrayList<>(3);
		for (int i = 0; i < 9; i++) if ((mask & (1 << i)) != 0) result.add(letters.get(i));
		return result;
	}

	private static Map<String, Set<String>> alphabets() {
		Map<String, String> values = new LinkedHashMap<>();
		values.put("Albanian", "abcdefghijklmnopqrstuvxyzçë");
		values.put("Catalan", "abcdefghijklmnopqrstuvwxyzàçèéíïòóúü");
		values.put("Croatian", "abcdefghijklmnoprstuvzćčđšž");
		values.put("Czech", "abcdefghijklmnopqrstuvwxyzáéíóúýčďěňřšťůž");
		values.put("Danish", "abcdefghijklmnopqrstuvwxyzåæø");
		values.put("Esperanto", "abcdefghijklmnoprstuvzĉĝĥĵŝŭ");
		values.put("Estonian", "abcdefghijklmnopqrstuvzäõöüšž");
		values.put("Finnish", "adeghijklmnoprstuvyäö");
		values.put("French", "abcdefghijklmnopqrstuvwxyzàâäæçèéêëîïôöùûüÿœ");
		values.put("German", "abcdefghijklmnopqrstuvwxyzßäöü");
		values.put("Hungarian", "abcdefghijklmnopqrstuvwxyzáéíóöúüőű");
		values.put("Icelandic", "abdefghijklmnoprstuvxyáæéíðóöúýþ");
		values.put("Latvian", "abcdefghijklmnoprstuvzāčēģīķļņšūž");
		values.put("Lithuanian", "abcdefghijklmnoprstuvyząčėęįšūųž");
		values.put("Polish", "abcdefghijklmnoprstuwyzóąćęłńśźż");
		values.put("Portuguese", "abcdefghijlmnopqrstuvxzàáâãçéêíóôõúü");
		values.put("Romanian", "abcdefghijklmnopqrstuvwxyzâîășț");
		values.put("Spanish", "abcdefghijklmnopqrstuvwxyzáéíñóúü");
		values.put("Swedish", "abcdefghijklmnopqrstuvwxyzäåö");
		values.put("Turkish", "abcdefghijklmnoprstuvyzçöüğış");
		values.put("Welsh", "abcdefghijlmnoprstuwyŵŷ");
		Map<String, Set<String>> result = new LinkedHashMap<>();
		values.forEach((name, letters) -> result.put(name, letters.codePoints()
			.mapToObj(codePoint -> new String(Character.toChars(codePoint))).collect(java.util.stream.Collectors.toSet())));
		return Map.copyOf(result);
	}

	private record Candidate(String language, int mask) {}
}
