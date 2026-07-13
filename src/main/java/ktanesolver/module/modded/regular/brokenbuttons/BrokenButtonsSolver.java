package ktanesolver.module.modded.regular.brokenbuttons;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;

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
	type = ModuleType.BROKEN_BUTTONS,
	id = "broken_buttons",
	name = "Broken Buttons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Follow the first matching rule as the twelve button labels change",
	tags = {"buttons", "words", "multi-step"}
)
public class BrokenButtonsSolver extends AbstractModuleSolver<BrokenButtonsInput, BrokenButtonsOutput> {
	private static final Set<String> PORT_NAMES = Set.of("rj-45", "dvi-d", "rca", "ps/2", "serial");

	@Override
	protected SolveResult<BrokenButtonsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BrokenButtonsInput input
	) {
		if(input == null || input.labels() == null || input.labels().size() != 12) {
			return failure("Enter exactly 12 button labels");
		}
		if(input.labels().stream().anyMatch(label -> label == null)) return failure("Button labels cannot be null");

		List<String> labels = input.labels().stream().map(BrokenButtonsSolver::normalize).toList();
		int pressedCount = number(module, "pressedCount");
		if(pressedCount < 0 || pressedCount > 4) return failure("Broken Buttons progress is invalid");
		boolean submitRight = Boolean.TRUE.equals(module.getState().get("submitRight"));
		boolean firstPressHadE = Boolean.TRUE.equals(module.getState().get("firstPressHadE"));
		int target = -1;

		if((target = indexOf(labels, "sea"::equals)) < 0) {
			target = indexOfRowsOneAndThreeStartingWithT(labels);
		}
		if(target < 0 && labels.contains("one") && labels.contains("submit")) {
			submitRight = false;
			target = labels.indexOf("one");
		}
		if(target < 0) target = labels.indexOf("");
		if(target < 0 && labels.contains("other")) {
			submitRight = !submitRight;
			target = labels.indexOf("other");
		}
		if(target < 0) target = duplicateIndex(labels);
		if(target < 0 && (labels.contains("port") || labels.contains("module"))) {
			target = indexOf(labels, PORT_NAMES::contains);
		}
		if(target < 0) target = indexOf(labels, label -> label.length() < 3);
		if(target < 0 && labels.contains("bomb") && labels.contains("boom")) target = labels.indexOf("boom");
		if(target < 0 && labels.contains("submit") && labels.contains("button")) {
			return submit(module, labels, submitRight, pressedCount);
		}
		if(target < 0 && labels.contains("column") && (labels.contains("seven") || labels.contains("two"))) {
			target = labels.indexOf("column") / 3 * 3;
		}
		if(target < 0 && pressedCount == 0) target = 5;
		if(target < 0) {
			if(firstPressHadE) submitRight = true;
			return submit(module, labels, submitRight, pressedCount);
		}

		if(pressedCount == 0) firstPressHadE = labels.get(target).contains("e");
		pressedCount++;
		storeState(module, Map.of(
			"input", new BrokenButtonsInput(labels),
			"pressedCount", pressedCount,
			"submitRight", submitRight,
			"firstPressHadE", firstPressHadE
		));
		String submitSide = pressedCount == 5 ? side(submitRight) : null;
		return success(new BrokenButtonsOutput(
			"PRESS_BUTTON", target / 3 + 1, target % 3 + 1, labels.get(target), submitSide, pressedCount
		), pressedCount == 5);
	}

	private SolveResult<BrokenButtonsOutput> submit(
		ModuleEntity module, List<String> labels, boolean submitRight, int pressedCount
	) {
		storeState(module, "input", new BrokenButtonsInput(labels));
		storeState(module, "submitRight", submitRight);
		return success(new BrokenButtonsOutput("SUBMIT", null, null, null, side(submitRight), pressedCount));
	}

	private static int duplicateIndex(List<String> labels) {
		Map<String, Integer> counts = new HashMap<>();
		labels.forEach(label -> counts.merge(label, 1, Integer::sum));
		return indexOf(labels, label -> counts.get(label) > 1);
	}

	private static int indexOfRowsOneAndThreeStartingWithT(List<String> labels) {
		for(int index : List.of(0, 1, 2, 6, 7, 8)) if(labels.get(index).startsWith("t")) return index;
		return -1;
	}

	private static int indexOf(List<String> labels, Predicate<String> predicate) {
		for(int index = 0; index < labels.size(); index++) if(predicate.test(labels.get(index))) return index;
		return -1;
	}

	private static int number(ModuleEntity module, String key) {
		Object value = module.getState().get(key);
		return value instanceof Number number ? number.intValue() : 0;
	}

	private static String normalize(String label) {
		return label.trim().toLowerCase(Locale.ROOT);
	}

	private static String side(boolean submitRight) {
		return submitRight ? "RIGHT" : "LEFT";
	}
}
