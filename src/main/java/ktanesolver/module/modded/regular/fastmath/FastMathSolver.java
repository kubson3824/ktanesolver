package ktanesolver.module.modded.regular.fastmath;

import java.util.ArrayList;
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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.fastmath.FastMathInput.Action;

@Service
@ModuleInfo(
	type = ModuleType.FAST_MATH,
	id = "fastMath",
	name = "Fast Math",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Look up each letter pair and apply the bomb's edgework offset",
	tags = {"letters", "math", "multi-stage", "edgework", "souvenir", "modded"}
)
public class FastMathSolver extends AbstractModuleSolver<FastMathInput, FastMathOutput> {
	private static final String LETTERS = "ABCDEGKNPSTXZ";
	private static final int[][] NUMBERS = {
		{25, 11, 53, 97, 2, 42, 51, 97, 12, 86, 55, 73, 33},
		{54, 7, 32, 19, 84, 33, 27, 78, 26, 46, 9, 13, 58},
		{86, 37, 44, 1, 5, 26, 93, 49, 18, 69, 23, 40, 22},
		{54, 28, 77, 93, 11, 0, 35, 61, 27, 48, 13, 72, 80},
		{99, 36, 23, 95, 67, 5, 26, 17, 44, 60, 26, 41, 67},
		{74, 95, 3, 4, 56, 23, 54, 29, 52, 38, 10, 76, 98},
		{88, 46, 37, 96, 2, 52, 81, 37, 12, 70, 14, 36, 78},
		{54, 43, 12, 65, 94, 3, 47, 23, 16, 62, 73, 46, 21},
		{7, 33, 26, 1, 67, 26, 27, 77, 83, 14, 27, 93, 9},
		{63, 64, 94, 27, 48, 84, 33, 10, 16, 74, 43, 99, 4},
		{35, 39, 3, 25, 47, 62, 38, 45, 88, 48, 34, 31, 27},
		{67, 30, 27, 71, 9, 11, 44, 37, 18, 40, 32, 15, 78},
		{13, 23, 26, 85, 92, 12, 73, 56, 81, 7, 75, 47, 99}
	};

	@Override
	protected SolveResult<FastMathOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FastMathInput input
	) {
		if (input == null || input.action() == null) return failure("Choose a Fast Math action");
		if (input.action() == Action.RESET) {
			module.getState().keySet().removeAll(List.of("stage", "lastPair", "lastAnswer"));
			return success(new FastMathOutput("", 0), false);
		}
		if (input.action() == Action.COMPLETE) {
			Object pair = module.getState().get("lastPair");
			Object answer = module.getState().get("lastAnswer");
			if (pair == null || answer == null) return failure("Solve the final displayed pair before marking the module complete");
			int stage = ((Number) module.getState().getOrDefault("stage", 0)).intValue();
			return success(new FastMathOutput(String.valueOf(answer), stage));
		}

		int left = index(input.leftLetter());
		int right = index(input.rightLetter());
		if (left < 0 || right < 0) return failure("Select both displayed letters");

		int answer = NUMBERS[left][right] + offset(bomb);
		if (answer > 99) answer %= 100;
		if (answer < 0) answer += 50;
		String formatted = String.format("%02d", answer);
		String pair = "" + LETTERS.charAt(left) + LETTERS.charAt(right);
		int stage = ((Number) module.getState().getOrDefault("stage", 0)).intValue() + 1;
		List<Object> history = module.getState().get("pairHistory") instanceof List<?> list
			? new ArrayList<>(list) : new ArrayList<>();
		history.add(pair);
		storeState(module, Map.of(
			"stage", stage,
			"lastPair", pair,
			"lastAnswer", formatted,
			"pairHistory", history
		));
		return success(new FastMathOutput(formatted, stage), false);
	}

	private static int index(String letter) {
		if (letter == null) return -1;
		String normalized = letter.trim().toUpperCase(Locale.ROOT);
		return normalized.length() == 1 ? LETTERS.indexOf(normalized) : -1;
	}

	private static int offset(BombEntity bomb) {
		int value = 0;
		if (bomb.isIndicatorLit("MSA")) value += 20;
		if (bomb.hasPort(PortType.SERIAL)) value += 14;
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (serial.chars().anyMatch(character -> "FAST".indexOf(character) >= 0)) value -= 5;
		if (bomb.hasPort(PortType.RJ45)) value += 27;
		if (bomb.getBatteryCount() > 3) value -= 15;
		return value;
	}
}
