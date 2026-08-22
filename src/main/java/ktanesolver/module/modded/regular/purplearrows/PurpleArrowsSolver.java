package ktanesolver.module.modded.regular.purplearrows;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
@ModuleInfo(type = ModuleType.PURPLE_ARROWS, id = "purpleArrowsModule", name = "Purple Arrows",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the hidden position from observed letters, navigate the wrapping word grid, and submit the unscrambled target.",
	tags = {"arrows", "words", "anagram", "grid", "navigation"})
public class PurpleArrowsSolver extends AbstractModuleSolver<PurpleArrowsInput, PurpleArrowsOutput> {
	static final List<String> WORDS = List.of(("THESIS IMMUNE AGENCY HEIGHT ACTIVE BOTHER VIABLE EXPOSE BORDER " +
		"INSURE INSIST BEHAVE THREAD APATHY OFFEND EXTEND VESSEL EARWAX " +
		"OCCUPY PRINCE PARDON WEIGHT HARBOR TRENCH ABSORB OUTFIT INJURY " +
		"HONEST REFUSE ACCESS PUNISH VALLEY WRITER HAPPEN BUCKET AGENDA " +
		"BUBBLE TYCOON HEALTH HAMMER USEFUL OFFSET QUAINT BOMBER DETAIL " +
		"RESULT ENERGY PIGEON EXCUSE PLEASE RELATE APPEAR THANKS VISUAL " +
		"TRANCE DINNER THRONE DANKER WEALTH JACKET TUMBLE WEAPON WONDER " +
		"BOUNCE HICCUP UNIQUE PRAYER BRONZE ENDURE TIMBER INSIDE EMBARK " +
		"PLEDGE POETRY VELVET WAITER ESTATE BELONG IGNORE HOTDOG REGRET " +
		"ROTTEN ADJUST EXPAND BORROW TREATY PLAYER JUNIOR WANDER HELMET " +
		"IMPACT BOTTOM TICKET GOSSIP RETIRE INFECT DIRECT BATTLE DIVIDE " +
		"VIRTUE UPDATE PEANUT IGNITE QUEBEC THRUST ARTIST ACCEPT RANDOM " +
		"REMEDY INSERT HUNTER TURKEY WINNER THEORY IMPORT OUTLET BUFFET").split(" "));
	private static final String STATE_CANDIDATES = "purpleArrowsCandidates", STATE_TARGET = "purpleArrowsTargetWord";

	@Override protected SolveResult<PurpleArrowsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, PurpleArrowsInput input) {
		if (input == null || input.displayedLetter() == null || !input.displayedLetter().trim().matches("(?i)[A-Z]")) return failure("Enter the single displayed letter");
		String letter = input.displayedLetter().trim().toUpperCase(Locale.ROOT), scrambled = clean(input.scrambledWord());
		boolean fresh = input.reset() || !module.getState().containsKey(STATE_TARGET);
		String target;
		List<Integer> candidates;
		if (fresh) {
			if (scrambled.length() != 6) return failure("Enter all six letters of the scrambled word");
			List<Integer> targets = new ArrayList<>(); for (int i = 0; i < WORDS.size(); i++) if (signature(WORDS.get(i)).equals(signature(scrambled))) targets.add(i);
			if (targets.size() != 1) return failure("The scrambled letters do not identify exactly one table word");
			int targetIndex = targets.getFirst(); target = WORDS.get(targetIndex); candidates = new ArrayList<>();
			for (int i = 0; i < WORDS.size(); i++) if (i != targetIndex && WORDS.get(i).startsWith(letter)) candidates.add(i);
			module.getState().keySet().removeAll(List.of(STATE_CANDIDATES, STATE_TARGET));
			storeState(module, STATE_TARGET, target);
		} else {
			target = String.valueOf(module.getState().get(STATE_TARGET));
			if (!scrambled.isEmpty() && !signature(target).equals(signature(scrambled))) return failure("The scrambled word changed; start over for the new puzzle");
			candidates = integers(module.getState().get(STATE_CANDIDATES));
			candidates.removeIf(i -> i < 0 || i >= WORDS.size() || !WORDS.get(i).startsWith(letter));
		}
		if (candidates.isEmpty()) return failure("No possible position has that letter; verify the last move and displayed letter");
		int targetIndex = WORDS.indexOf(target);
		if (candidates.size() == 1) {
			int current = candidates.getFirst();
			if (current == targetIndex) return success(new PurpleArrowsOutput("submit", target, 1, true, true));
			String route = route(current, targetIndex); storeState(module, STATE_CANDIDATES, List.of(targetIndex));
			return success(new PurpleArrowsOutput(route, target, 1, true, false), false);
		}
		String action = diagnostic(candidates); List<Integer> moved = candidates.stream().map(i -> move(i, action)).toList();
		storeState(module, STATE_CANDIDATES, moved);
		return success(new PurpleArrowsOutput(action, target, moved.size(), false, false), false);
	}

	private static String diagnostic(List<Integer> candidates) {
		String best = "u"; int bestWorst = candidates.size();
		List<String> frontier = List.of("");
		for (int depth = 1; depth <= 5; depth++) {
			List<String> next = new ArrayList<>();
			for (String prefix : frontier) for (char direction : new char[]{'u','d','l','r'}) {
				String command = prefix + direction; next.add(command); Map<Character, Integer> groups = new HashMap<>();
				for (int position : candidates) groups.merge(WORDS.get(move(position, command)).charAt(0), 1, Integer::sum);
				int worst = groups.values().stream().mapToInt(Integer::intValue).max().orElse(candidates.size());
				if (worst < bestWorst) { bestWorst = worst; best = command; }
			}
			if (bestWorst == 1) break; frontier = next;
		}
		return best;
	}
	static int move(int position, String command) {
		int row = position / 9, column = position % 9;
		for (char direction : command.toCharArray()) switch (direction) {
			case 'u' -> row = (row + 12) % 13; case 'd' -> row = (row + 1) % 13;
			case 'l' -> column = (column + 8) % 9; case 'r' -> column = (column + 1) % 9; default -> { }
		}
		return row * 9 + column;
	}
	static String route(int start, int target) {
		int sr = start / 9, sc = start % 9, tr = target / 9, tc = target % 9; StringBuilder route = new StringBuilder();
		int down = (tr - sr + 13) % 13, up = (sr - tr + 13) % 13; route.append(String.valueOf(down <= up ? 'd' : 'u').repeat(Math.min(down, up)));
		int right = (tc - sc + 9) % 9, left = (sc - tc + 9) % 9; route.append(String.valueOf(right <= left ? 'r' : 'l').repeat(Math.min(right, left)));
		return route.toString();
	}
	private static String clean(String value) { return value == null ? "" : value.replaceAll("[^A-Za-z]", "").toUpperCase(Locale.ROOT); }
	private static String signature(String value) { char[] chars = value.toCharArray(); java.util.Arrays.sort(chars); return new String(chars); }
	private static List<Integer> integers(Object value) { List<Integer> result = new ArrayList<>(); if (value instanceof List<?> list) for (Object item : list) if (item instanceof Number number) result.add(number.intValue()); return result; }
}
