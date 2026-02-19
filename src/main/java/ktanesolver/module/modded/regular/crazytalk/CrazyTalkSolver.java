package ktanesolver.module.modded.regular.crazytalk;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.CRAZY_TALK,
	id = "crazy_talk",
	name = "Crazy Talk",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Flip the switch down/up at the correct seconds based on the display text.",
	tags = { "modded", "display", "timing" }
)
public class CrazyTalkSolver extends AbstractModuleSolver<CrazyTalkInput, CrazyTalkOutput> {

	private static final Pattern SPACES = Pattern.compile("\\s+");

	/** Normalized display text -> "downAt/upAt" (e.g. "5/4"). All entries from the manual. */
	private static final Map<String, String> DISPLAY_TO_ACTION = buildTable();

	private static Map<String, String> buildTable() {
		Map<String, String> m = new LinkedHashMap<>();
		// Page 1 table 1
		put(m, "← ← → ← → →", "5/4");
		put(m, "1 3 2 4", "3/2");
		put(m, "LEFT ARROW LEFT WORD RIGHT ARROW LEFT WORD RIGHT ARROW RIGHT WORD", "5/8");
		put(m, "BLANK", "1/3");
		put(m, "LITERALLY BLANK", "1/5");
		put(m, "FOR THE LOVE OF ALL THAT IS GOOD AND HOLY PLEASE FULLSTOP FULLSTOP.", "9/0");
		put(m, "AN ACTUAL LEFT ARROW LITERAL PHRASE", "5/3");
		put(m, "FOR THE LOVE OF - THE DISPLAY JUST CHANGED, I DIDN'T KNOW THIS MOD COULD DO THAT. DOES IT MENTION THAT IN THE MANUAL?", "8/7");
		put(m, "ALL WORDS ONE THREE TO FOR FOR AS IN THIS IS FOR YOU", "4/0");
		put(m, "LITERALLY NOTHING", "1/4");
		put(m, "NO, LITERALLY NOTHING", "2/5");
		put(m, "THE WORD LEFT", "7/0");
		put(m, "HOLD ON IT'S BLANK", "1/9");
		put(m, "SEVEN WORDS FIVE WORDS THREE WORDS THE PUNCTUATION FULLSTOP", "0/5");
		put(m, "THE PHRASE THE WORD STOP TWICE", "9/1");
		put(m, "THE FOLLOWING SENTENCE THE WORD NOTHING", "2/7");
		put(m, "ONE THREE TO FOR", "3/9");
		put(m, "THREE WORDS THE WORD STOP", "7/3");
		put(m, "DISREGARD WHAT I JUST SAID. FOUR WORDS, NO PUNCTUATION. ONE THREE 2 4.", "3/1");
		put(m, "1 3 2 FOR", "1/0");
		put(m, "DISREGARD WHAT I JUST SAID. TWO WORDS THEN TWO DIGITS. ONE THREE 2 4.", "0/8");
		put(m, "WE JUST BLEW UP", "4/2");
		// Page 1 table 2
		put(m, "NO REALLY.", "5/2");
		put(m, "← LEFT → LEFT → RIGHT", "5/6");
		put(m, "ONE AND THEN 3 TO 4", "4/7");
		put(m, "STOP TWICE", "7/6");
		put(m, "LEFT", "6/9");
		put(m, "..", "8/5");
		put(m, "PERIOD PERIOD", "8/2");
		put(m, "THERE ARE THREE WORDS NO PUNCTUATION READY? STOP DOT PERIOD", "5/0");
		put(m, "NOVEBMER OSCAR SPACE, LIMA INDIGO TANGO ECHO ROMEO ALPHA LIMA LIMA YANKEE SPACE NOVEMBER OSCAR TANGO HOTEL INDEGO NOVEMBER GOLF", "2/9");
		put(m, "FIVE WORDS THREE WORDS THE PUNCTUATION FULLSTOP", "1/9");
		put(m, "THE PHRASE: THE PUNCTUATION FULLSTOP", "9/3");
		put(m, "EMPTY SPACE", "1/6");
		put(m, "ONE THREE TWO FOUR", "3/7");
		put(m, "IT'S SHOWING NOTHING", "2/3");
		put(m, "LIMA ECHO FOXTROT TANGO SPACE ALPHA ROMEO ROMEO OSCAR RISKY SPACE SIERRA YANKEE MIKE BRAVO OSCAR LIMA", "1/2");
		put(m, "ONE 3 2 4", "3/4");
		put(m, "STOP.", "7/4");
		put(m, ".PERIOD", "8/1");
		put(m, "NO REALLY STOP", "5/1");
		put(m, "1 3 TOO 4", "2/0");
		put(m, "PERIOD TWICE", "8/3");
		// Page 2 table 1
		put(m, "1 3 TOO WITH 2 OHS FOUR", "4/2");
		put(m, "1 3 TO 4", "3/0");
		put(m, "STOP DOT PERIOD", "5/0");
		put(m, "LEFT LEFT RIGHT LEFT RIGHT RIGHT", "6/7");
		put(m, "IT LITERALLY SAYS THE WORD ONE AND THEN THE NUMBERS 2 3 4", "4/5");
		put(m, "ONE IN LETTERS 3 2 4 IN NUMBERS", "3/5");
		put(m, "WAIT FORGET EVERYTHING I JUST SAID, TWO WORDS THEN TWO SYMBOLS THEN TWO WORDS: ← ← RIGHT LEFT → →", "1/6");
		put(m, "1 THREE TWO FOUR", "3/6");
		put(m, "PERIOD", "7/9");
		put(m, ".STOP", "7/8");
		put(m, "NOVEBMER OSCAR SPACE, LIMA INDIA TANGO ECHO ROMEO ALPHA LIMA LIMA YANKEE SPACE NOVEMBER OSCAR TANGO HOTEL INDIA NOVEMBER GOLF", "0/7");
		put(m, "LIMA ECHO FOXTROT TANGO SPACE ALPHA ROMEO ROMEO OSCAR WHISKEY SPACE SIERRA YANKEE MIKE BRAVO OSCAR LIMA", "6/5");
		put(m, "NOTHING", "1/2");
		put(m, "THERE'S NOTHING", "1/8");
		put(m, "STOP STOP", "7/5");
		put(m, "RIGHT ALL IN WORDS STARTING NOW ONE TWO THREE FOUR", "4/9");
		put(m, "THE PHRASE THE WORD LEFT", "7/1");
		put(m, "LEFT ARROW SYMBOL TWICE THEN THE WORDS RIGHT LEFT RIGHT THEN A RIGHT ARROW SYMBOL", "5/9");
		put(m, "LEFT LEFT RIGHT ← RIGHT →", "5/7");
		put(m, "NO COMMA LITERALLY NOTHING", "2/4");
		put(m, "HOLD ON CRAZY TALK WHILE I DO THIS NEEDY", "2/1");
		// Page 2 table 2
		put(m, "THIS ONE IS ALL ARROW SYMBOLS NO WORDS", "2/8");
		put(m, "←", "6/3");
		put(m, "THE WORD STOP TWICE", "9/4");
		put(m, "← ← RIGHT LEFT → →", "6/1");
		put(m, "THE PUNCTUATION FULLSTOP", "9/2");
		put(m, "1 3 TOO WITH TWO OS 4", "4/1");
		put(m, "THREE WORDS THE PUNCTUATION FULLSTOP", "9/9");
		put(m, "OK WORD FOR WORD LEFT ARROW SYMBOL TWICE THEN THE WORDS RIGHT LEFT RIGHT THEN A RIGHT ARROW SYMBOL", "6/0");
		put(m, "DOT DOT", "8/6");
		put(m, "LEFT ARROW", "6/8");
		put(m, "AFTER I SAY BEEP FIND THIS PHRASE WORD FOR WORD BEEP AN ACTUAL LEFT ARROW", "7/2");
		put(m, "ONE THREE 2 WITH TWO OHS 4", "4/3");
		put(m, "LEFT ARROW SYMBOL", "6/4");
		put(m, "AN ACTUAL LEFT ARROW", "6/2");
		put(m, "THAT'S WHAT IT'S SHOWING", "2/1");
		put(m, "THE PHRASE THE WORD NOTHING", "2/6");
		put(m, "THE WORD ONE AND THEN THE NUMBERS 3 2 4", "4/8");
		put(m, "ONE 3 2 FOUR", "3/8");
		put(m, "ONE WORD THEN PUNCTUATION. STOP STOP.", "0/9");
		put(m, "THE WORD BLANK", "0/1");
		put(m, "FULLSTOP FULLSTOP", "8/4");
		return m;
	}

	private static void put(Map<String, String> m, String display, String action) {
		m.put(normalize(display), action);
	}

	private static String normalize(String s) {
		if (s == null) return "";
		return SPACES.matcher(s.trim()).replaceAll(" ").trim();
	}

	@Override
	protected SolveResult<CrazyTalkOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CrazyTalkInput input) {
		String displayText = input.displayText();
		if (displayText == null) {
			return failure("Display text is required");
		}
		String key = normalize(displayText);
		String action = DISPLAY_TO_ACTION.get(key);
		if (action == null) {
			return failure("No matching display text");
		}
		String[] parts = action.split("/");
		if (parts.length != 2) {
			return failure("Invalid action in table: " + action);
		}
		int downAt = Integer.parseInt(parts[0].trim());
		int upAt = Integer.parseInt(parts[1].trim());
		if (downAt < 0 || downAt > 9 || upAt < 0 || upAt > 9) {
			return failure("Action out of range: " + action);
		}
		storeState(module, "input", input);
		return success(new CrazyTalkOutput(downAt, upAt));
	}
}
