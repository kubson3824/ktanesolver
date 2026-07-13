package ktanesolver.module.modded.regular.wordsearch;

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
	type = ModuleType.WORD_SEARCH,
	id = "word-search",
	name = "Word Search",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Get the candidate words from the four corner letters",
	tags = {"word", "grid", "serial number", "modded"}
)
public class WordSearchSolver extends AbstractModuleSolver<WordSearchInput, WordSearchOutput> {
	private static final String CHART_LETTERS = ".VUSZ..PQNXFY.TIMEDA.KBWHJO..RLCG..";
	private static final String[] WORD_PAIRS = (
		"/;HOTEL/DONE;SEARCH/QUEBEC;ADD/CHECK;SIERRA/FIND;FINISH/EAST;/;" +
		"PORT/COLOR;BOOM/SUBMIT;LINE/BLUE;KABOOM/ECHO;PANIC/FALSE;MANUAL/ALARM;DECOY/CALL;" +
		"SEE/TWENTY;INDIA/NORTH;NUMBER/LOOK;ZULU/GREEN;VICTOR/XRAY;DELTA/YES;HELP/LOCATE;" +
		"ROMEO/BEEP;TRUE/EXPERT;MIKE/EDGE;FOUND/RED;BOMBS/WORD;WORK/UNIQUE;TEST/JINX;" +
		"GOLF/LETTER;TALK/SIX;BRAVO/SERIAL;SEVEN/TIMER;MODULE/SPELL;LIST/TANGO;YANKEE/SOLVE;/;" +
		"CHART/OSCAR;MATH/NEXT;READ/LISTEN;LIMA/FOUR;COUNT/OFFICE;/"
	).split(";", -1);
	private static final int[] OFFSETS = {8, 7, 1, 0};

	@Override
	protected SolveResult<WordSearchOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, WordSearchInput input
	) {
		if (input == null || input.corners() == null) return failure("Enter the four corner letters");
		String corners = input.corners().replaceAll("\\s", "").toUpperCase(Locale.ROOT);
		if (!corners.matches("[A-Z]{4}")) return failure("Enter exactly four letters: top-left, top-right, bottom-left, bottom-right");

		Set<String> candidates = new LinkedHashSet<>();
		for (int i = 0; i < corners.length(); i++) {
			int pairIndex = CHART_LETTERS.indexOf(corners.charAt(i)) + OFFSETS[i];
			candidates.add(WORD_PAIRS[pairIndex].split("/")[bomb.isLastDigitOdd() ? 1 : 0]);
		}

		storeState(module, "corners", corners);
		return success(new WordSearchOutput(List.copyOf(candidates)), input.confirmed());
	}
}
