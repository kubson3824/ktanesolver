package ktanesolver.module.modded.regular.thematrix;

import java.util.ArrayList;
import java.util.Arrays;
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
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.THE_MATRIX,
	id = "matrix",
	name = "The Matrix",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Unscramble the access code, identify the glitch, and choose the correct pill and timer digit.",
	tags = {"words", "anagram", "timing", "souvenir"}
)
public class TheMatrixSolver extends AbstractModuleSolver<TheMatrixInput, TheMatrixOutput> {
	private static final String[] ROW_NAMES = {"Smith", "Merovingian", "Morpheus", "Niobe", "Bane", "Oracle", "Keymaker", "Link", "Trinity", "Apoc"};
	private static final String[] COLUMN_NAMES = {"Twins", "Neo", "Seraph", "Cypher", "Persephone", "Tank", "Dozer", "Mouse", "Switch", "Architect"};
	private static final int[][] ACCESS_SECONDS = {
		{45,30,27,24,21,18,15,12,9,6}, {30,27,24,21,18,15,12,9,6,9},
		{27,24,21,18,15,12,9,6,9,12}, {24,21,18,15,12,9,6,9,12,15},
		{21,18,15,12,9,6,9,12,15,18}, {18,15,12,9,6,9,12,15,18,21},
		{15,12,9,6,9,12,15,18,21,24}, {12,9,6,9,12,15,18,21,24,27},
		{9,6,9,12,15,18,21,24,27,30}, {6,9,12,15,18,21,24,27,30,45}
	};
	private static final String[][] WORD_LISTS = {
		{"Headjack","Phone","Dystopia","Control","Paradise","Utopia","Version","Nebuchadnezzar","Zion","Fight"},
		{"Utopia","Mind","Squiddy","Guns","Trace","Spoon","Machine","Red","White","Paradise"},
		{"Metacortex","Flint","Nova","White","Rabbit","Follow","Matrix","Free","Neural","Mind"},
		{"Fight","Free","Nova","Blue","Fields","Choice","Battery","Program","Flint","Headjack"},
		{"KungFu","Choi","Red","Blue","Pill","Jump","Program","Agent","Sentient","Squiddy"},
		{"Dystopia","Rabbit","Jump","Code","Mirror","Cookie","Human","Pill","Follow","Version"},
		{"Sentinel","Machine","Prison","Human","Fields","Battery","Code","Training","Guns","Hel"},
		{"Elevator","Sentinel","Choi","Matrix","Nebuchadnezzar","Control","Metacortex","Sentient","Unplug","Hardwire"},
		{"Trainman","Spoon","Cookie","Elevator","Hardwire","Choice","Trace","Mirror","Unplug","Interface"},
		{"Prison","KungFu","Interface","Neural","Trainman","Hel","Agent","Training","Zion","Phone"}
	};

	@Override
	protected SolveResult<TheMatrixOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheMatrixInput input) {
		if (input == null || input.firstAccessCode() == null || input.secondAccessCode() == null || input.words() == null || input.words().size() != 6)
			return failure("Enter both scrambled access-code names and all six words");

		String first = unscramble(input.firstAccessCode());
		String second = unscramble(input.secondAccessCode());
		if (first == null || second == null || first.equals(second)) return failure("One or both access-code names could not be uniquely unscrambled");

		int row = indexOf(ROW_NAMES, first), column = indexOf(COLUMN_NAMES, second);
		if (row < 0 || column < 0) {
			row = indexOf(ROW_NAMES, second);
			column = indexOf(COLUMN_NAMES, first);
		}
		if (row < 0 || column < 0) return failure("The access code must contain one row name and one column name");

		List<String> words = new ArrayList<>(6);
		for (String word : input.words()) {
			if (word == null || normalize(word).isEmpty()) return failure("All six displayed words are required");
			words.add(word.trim());
		}
		int listNumber = -1;
		for (int i = 0; i < WORD_LISTS.length; i++) {
			Set<String> list = normalizedSet(WORD_LISTS[i]);
			long matches = words.stream().map(TheMatrixSolver::normalize).filter(list::contains).count();
			if (matches == 5) {
				if (listNumber >= 0) return failure("The six words match more than one Matrix list");
				listNumber = i;
			}
		}
		if (listNumber < 0) return failure("Exactly five words must belong to one Matrix list");
		Set<String> target = normalizedSet(WORD_LISTS[listNumber]);
		String glitch = words.stream().filter(word -> !target.contains(normalize(word))).findFirst().orElseThrow();
		String pill = normalize(glitch).length() % 2 == 0 ? "RED" : "BLUE";
		List<String> names = List.of(ROW_NAMES[row], COLUMN_NAMES[column]);
		storeState(module, "matrixAccessCodeNames", names);
		return success(new TheMatrixOutput(names, ACCESS_SECONDS[row][column], listNumber, glitch, pill, listNumber));
	}

	private static String unscramble(String value) {
		String signature = signature(value);
		List<String> matches = Arrays.stream(ROW_NAMES).filter(name -> signature(name).equals(signature)).toList();
		List<String> columns = Arrays.stream(COLUMN_NAMES).filter(name -> signature(name).equals(signature)).toList();
		if (matches.size() + columns.size() != 1) return null;
		return matches.isEmpty() ? columns.getFirst() : matches.getFirst();
	}

	private static String signature(String value) {
		char[] chars = normalize(value).toCharArray();
		Arrays.sort(chars);
		return new String(chars);
	}

	private static String normalize(String value) {
		return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z]", "");
	}

	private static int indexOf(String[] values, String value) {
		for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i;
		return -1;
	}

	private static Set<String> normalizedSet(String[] values) {
		Set<String> result = new HashSet<>();
		for (String value : values) result.add(normalize(value));
		return result;
	}
}
