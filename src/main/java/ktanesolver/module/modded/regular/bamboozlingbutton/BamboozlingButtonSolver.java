package ktanesolver.module.modded.regular.bamboozlingbutton;

import java.util.LinkedHashMap;
import java.util.List;
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
import ktanesolver.module.modded.regular.bamboozlingbutton.BamboozlingButtonInput.Color;
import ktanesolver.module.modded.regular.bamboozlingbutton.BamboozlingButtonInput.QuoteStyle;
import ktanesolver.module.modded.regular.bamboozlingbutton.BamboozlingButtonOutput.Timing;

@Service
@ModuleInfo(type = ModuleType.BAMBOOZLING_BUTTON, id = "bamboozlingButton", name = "Bamboozling Button",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the cycling message, its colors, punctuation, and button labels to time two presses.",
	tags = {"button", "timing", "text", "multi-stage"})
public class BamboozlingButtonSolver extends AbstractModuleSolver<BamboozlingButtonInput, BamboozlingButtonOutput> {
	private static final List<String> TEXTS = List.of(
		"A LETTER", "A WORD", "THE LETTER", "THE WORD", "1 LETTER", "1 WORD", "ONE LETTER", "ONE WORD",
		"B", "C", "D", "E", "G", "K", "N", "P", "Q", "T", "V", "W", "Y", "BRAVO", "CHARLIE", "DELTA", "ECHO", "GOLF", "KILO", "NOVEMBER", "PAPA", "QUEBEC", "TANGO", "VICTOR", "WHISKEY", "YANKEE", "COLOUR", "RED", "ORANGE", "YELLOW", "LIME", "GREEN", "JADE", "CYAN", "AZURE", "BLUE", "VIOLET", "MAGENTA", "ROSE", "IN RED", "IN YELLOW", "IN GREEN", "IN CYAN", "IN BLUE", "IN MAGENTA", "QUOTE", "END QUOTE");
	private static final int[][] TABLE = rows(
		"-10,8,-8,3,5,-10,-9,7,3,-5,1,-2,6,5,1,-10,7,-6,-9,-7,-10,-7,-3,4,-8,-1,-5,4,7,-8,-1,6,-7,10,7,-4,-3,7,-3,-8,-6,6,0,4,1,4,-6,1,7,-5,8,9,-8,-9,7",
		"8,5,2,9,-3,3,-9,-5,2,8,10,3,-4,2,5,2,9,-10,-9,10,-5,-10,7,-8,8,10,-4,10,-2,-6,-7,0,9,10,1,0,-10,8,2,-5,-7,-8,-4,6,3,-5,-2,-10,-8,6,2,6,0,-8,0",
		"6,-2,-6,8,7,9,4,9,-5,-1,-3,8,10,-9,3,7,3,-2,-10,-8,9,2,1,0,5,4,2,-7,9,-4,-7,1,5,1,6,-2,7,-6,-7,10,9,4,-9,3,-7,-3,6,3,-2,-10,8,0,-9,9,-6",
		"10,-4,-8,-1,9,6,10,0,1,-1,-10,-9,-8,3,8,9,-3,2,3,2,10,5,-5,-10,9,-5,0,1,-9,3,-8,8,1,2,-9,-3,3,6,7,-4,-6,9,-9,-3,-5,3,10,-9,-3,5,8,-7,1,-4,9",
		"6,-5,-4,-3,4,-9,-5,-9,9,-1,-10,-2,1,-5,-2,-4,1,6,7,-4,2,8,-5,5,9,-8,-9,9,4,-4,3,0,9,-2,-8,7,5,-6,-1,-5,-1,-8,5,8,-4,-7,-10,5,-2,6,-5,-3,-4,-2,6",
		"-5,8,5,-9,-6,0,-9,0,10,-8,10,-9,7,9,7,-10,-6,6,2,-2,-4,7,5,5,6,3,-2,3,0,6,-1,7,10,9,3,-2,2,10,6,-5,-7,-1,-8,-5,6,9,7,-7,-1,6,-2,9,7,5,-1",
		"6,7,-1,0,10,9,1,-8,3,2,9,7,6,1,-6,-10,1,-2,-4,1,6,-6,-1,2,9,8,-4,-6,-4,5,10,8,10,-2,10,5,6,-8,9,-1,-10,3,10,0,-6,-8,-3,6,-9,-4,-2,-8,9,-6,10",
		"3,10,4,10,6,1,8,6,-4,-6,5,-5,9,0,2,-9,8,8,4,-4,-2,-6,-7,-8,5,2,4,-2,-8,9,-9,7,4,8,-9,3,-4,-5,2,6,-3,1,10,8,-4,-10,-8,-3,7,8,-7,-6,3,10,3",
		"7,8,4,6,-4,-9,0,-7,7,-9,7,10,5,-8,-2,5,7,6,-1,5,-1,-10,2,-6,-3,-9,5,1,-2,9,-3,9,0,8,7,-8,-2,1,7,-8,-6,9,0,-7,4,2,-4,9,2,-6,4,-1,8,0,6",
		"3,7,-5,-2,-6,9,7,-4,-5,10,3,8,-1,-4,6,4,2,5,7,10,3,-8,7,-8,7,-3,5,0,-6,2,-4,-10,8,9,8,5,-6,-4,2,6,7,9,0,8,6,-5,7,1,8,-4,8,10,-1,-8,6",
		"-4,-8,8,7,-5,0,-3,-9,-10,-4,6,9,-7,10,-2,-4,-10,5,3,5,10,-2,2,10,-9,-4,8,-4,-5,-10,7,-6,6,8,9,1,-6,1,4,0,-1,-3,-7,-5,-1,-7,7,-4,5,5,3,7,2,9,-7",
		"-9,-8,2,3,-2,-4,8,-6,8,2,-5,10,2,-4,-5,4,-5,-6,9,-3,-4,6,-9,2,3,1,-7,9,7,8,9,0,-8,7,0,-5,0,-2,3,4,2,-4,-1,-8,3,2,4,8,-8,-9,5,-3,8,-6,-3",
		"0,2,7,3,5,-4,3,9,8,6,2,-2,-9,2,-4,7,9,-8,-3,-8,2,1,-6,-7,8,-3,-1,9,0,1,4,1,5,3,-1,-3,4,3,-10,10,7,3,4,-4,2,8,-8,1,-6,1,3,-8,6,2,-5",
		"-1,1,-4,-2,-7,0,1,2,9,-2,4,10,-1,5,-7,-6,-5,3,7,-5,7,6,-6,4,-9,1,-7,-5,7,6,-3,-8,0,-5,10,-9,-7,1,6,2,8,-4,5,2,-4,-2,-7,-8,-1,-4,-2,-10,3,7,-9",
		"0,-6,6,0,3,-9,5,1,10,-9,-6,2,-4,3,-2,1,6,-10,-4,9,-7,10,-8,-3,1,8,10,4,-8,7,-9,4,-9,-1,4,3,-1,-2,7,-9,-1,-7,-9,-10,-6,-2,1,-9,4,3,-6,-9,4,10,2");

	@Override protected SolveResult<BamboozlingButtonOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BamboozlingButtonInput input) {
		if (input == null || input.buttonColor() == null || input.fourthDisplayColor() == null || input.fifthDisplayColor() == null || input.quoteStyle() == null)
			return failure("All Bamboozling Button colors and punctuation are required");
		int first = index(input.firstDisplay()), third = index(input.thirdDisplay()), fourth = index(input.fourthDisplay()), fifth = index(input.fifthDisplay());
		int top = index(input.topLabel()), bottom = index(input.bottomLabel());
		if (first < 0 || first > 7 || third < 0 || third > 7) return failure("The first and third displays must use one of the eight opening texts");
		if (fourth < 8 || fifth < 8) return failure("The fourth and fifth displays must use one of the 47 closing texts");
		if (top < 0 || bottom < 0) return failure("Both button labels must match a displayed text option");
		if (input.fourthDisplayColor() == Color.BLACK || input.fifthDisplayColor() == Color.BLACK) return failure("The fourth and fifth displays cannot be black");

		int stage = module.getState().get("bamboozlingButtonStage") instanceof Number value ? value.intValue() : 1;
		if (stage < 1 || stage > 2) return failure("The saved Bamboozling Button stage is invalid");
		boolean topSpecial = top == first || top == third || top == fourth || top == fifth;
		boolean bottomSpecial = !topSpecial && (bottom == first || bottom == third || bottom == fourth || bottom == fifth);
		storeObservation(module, stage, input, topSpecial ? "TOP" : bottomSpecial ? "BOTTOM" : "NONE");

		BamboozlingButtonOutput output;
		if (topSpecial || bottomSpecial) {
			int color = (topSpecial ? input.fourthDisplayColor() : input.fifthDisplayColor()).ordinal();
			int text = topSpecial ? fourth : fifth;
			int digit = Math.floorMod(TABLE[color][text], 10);
			output = new BamboozlingButtonOutput(stage, Timing.LAST_DIGIT, digit, digit, true,
				"Double-tap when the last timer digit is " + digit + ".", List.of("dtap " + digit), Math.min(2, stage + 1));
		} else {
			int a = TABLE[input.buttonColor().ordinal()][fourth - first] + TABLE[14 - input.buttonColor().ordinal()][fifth - third];
			int b = TABLE[input.fourthDisplayColor().ordinal()][top] + TABLE[input.fifthDisplayColor().ordinal()][bottom];
			if (input.commaAfterFirst()) { int swap = a; a = b; b = swap; }
			Timing timing = input.quoteStyle() == QuoteStyle.NONE ? Timing.LAST_DIGIT : Timing.LAST_TWO_DIGIT_SUM;
			int firstValue = transform(a, input.quoteStyle()), secondValue = transform(b, input.quoteStyle());
			List<String> commands = timing == Timing.LAST_DIGIT
				? List.of("press " + firstValue, "press " + secondValue)
				: List.of("press " + secondsWithDigitSum(firstValue), "press " + secondsWithDigitSum(secondValue));
			String target = timing == Timing.LAST_DIGIT ? "last timer digit" : "sum of the last two timer digits";
			output = new BamboozlingButtonOutput(stage, timing, firstValue, secondValue, false,
				"Press when the " + target + " is " + firstValue + ", then press again when it is " + secondValue + ".", commands, Math.min(2, stage + 1));
		}
		storeState(module, "bamboozlingButtonStage", Math.min(2, stage + 1));
		return success(output, stage == 2);
	}

	private static int transform(int value, QuoteStyle style) {
		return switch (style) {
			case NONE -> Math.floorMod(value, 10);
			case SINGLE -> Math.floorMod(value, 9) + 3;
			case DOUBLE -> Math.floorMod(2 * value, 9) + 3;
		};
	}

	private static String secondsWithDigitSum(int sum) {
		for (int seconds = 0; seconds < 60; seconds++) if (seconds / 10 + seconds % 10 == sum) return String.format("%02d", seconds);
		throw new IllegalArgumentException("No seconds value has digit sum " + sum);
	}

	private static int index(String text) { return text == null ? -1 : TEXTS.indexOf(text.trim().toUpperCase()); }
	private static String color(Color color) { String value = color.name().toLowerCase(); return Character.toUpperCase(value.charAt(0)) + value.substring(1); }

	private static void storeObservation(ModuleEntity module, int stage, BamboozlingButtonInput input, String specialCase) {
		Map<String, Object> data = new LinkedHashMap<>();
		data.put("buttonColor", color(input.buttonColor()));
		data.put("display1", input.firstDisplay().trim().toUpperCase());
		data.put("display3", input.thirdDisplay().trim().toUpperCase());
		data.put("display4", input.fourthDisplay().trim().toUpperCase());
		data.put("display5", input.fifthDisplay().trim().toUpperCase());
		data.put("display4Color", color(input.fourthDisplayColor()));
		data.put("display5Color", color(input.fifthDisplayColor()));
		data.put("topLabel", input.topLabel().trim().toUpperCase());
		data.put("bottomLabel", input.bottomLabel().trim().toUpperCase());
		data.put("specialCase", specialCase);
		module.getState().put("bamboozlingButtonStage" + stage, data);
	}

	private static int[][] rows(String... rows) {
		int[][] result = new int[rows.length][];
		for (int i = 0; i < rows.length; i++) {
			result[i] = java.util.Arrays.stream(rows[i].split(",")).mapToInt(Integer::parseInt).toArray();
			if (result[i].length != 55) throw new IllegalStateException("Bamboozling Button table row " + i + " has " + result[i].length + " entries");
		}
		return result;
	}
}
