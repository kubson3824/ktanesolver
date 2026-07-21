package ktanesolver.module.modded.regular.backgrounds;

import java.util.Map;
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
	type = ModuleType.FAULTY_BACKGROUNDS,
	id = "faulty-backgrounds",
	name = "Faulty Backgrounds",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the fake button, then find the target counter value",
	tags = {"colors", "buttons", "counter", "edgework", "modded"}
)
public class FaultyBackgroundsSolver extends AbstractModuleSolver<FaultyBackgroundsInput, FaultyBackgroundsOutput> {
	private static final Set<String> LABELS = Set.of("PUSH_ME", "BUSH_ME", "PUSH_NE", "PUSH_HE", "PUSH_SHE");
	private static final Set<String> COUNTER_BEHAVIORS = Set.of(
		"ALL_VISIBLE", "LEFT_NO_CHANGE", "RIGHT_NO_CHANGE", "EVENS_HIDDEN", "ODDS_HIDDEN", "FIVE_HIDDEN"
	);

	@Override
	protected SolveResult<FaultyBackgroundsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FaultyBackgroundsInput input
	) {
		if (input == null) return failure("Enter the backing, both buttons, and counter behavior");
		String backing = BackgroundsSolver.normalize(input.backingColor());
		String leftColor = BackgroundsSolver.normalize(input.leftButtonColor());
		String rightColor = BackgroundsSolver.normalize(input.rightButtonColor());
		String leftLabel = normalizeToken(input.leftButtonLabel());
		String rightLabel = normalizeToken(input.rightButtonLabel());
		String counter = normalizeToken(input.counterBehavior());
		if (!BackgroundsSolver.isColor(backing) || !BackgroundsSolver.isColor(leftColor) || !BackgroundsSolver.isColor(rightColor))
			return failure("Invalid backing or button color");
		if (leftColor.equals(rightColor)) return failure("The two button colors must be different");
		if (!LABELS.contains(leftLabel) || !LABELS.contains(rightLabel)) return failure("Invalid button label");
		if (!leftLabel.equals("PUSH_ME") && !rightLabel.equals("PUSH_ME")) return failure("At least one button must say PUSH ME!");
		if (!COUNTER_BEHAVIORS.contains(counter)) return failure("Invalid counter behavior");
		if (counter.equals("FIVE_HIDDEN") && !leftColor.equals("BLACK") && !rightColor.equals("BLACK"))
			return failure("A black button is required when only 5 disappears");

		Decision decision = findFakeButton(bomb, backing, leftColor, rightColor, leftLabel, rightLabel, counter);
		String correctButton = decision.fakeButton().equals("LEFT") ? "RIGHT" : "LEFT";
		String correctColor = correctButton.equals("LEFT") ? leftColor : rightColor;
		BackgroundsOutput backgrounds = BackgroundsSolver.solveColors(bomb, backing, correctColor);
		storeState(module, Map.of(
			"backingColor", backing,
			"leftButtonColor", leftColor,
			"rightButtonColor", rightColor,
			"leftButtonLabel", leftLabel,
			"rightButtonLabel", rightLabel,
			"counterBehavior", counter
		));
		return success(new FaultyBackgroundsOutput(
			correctButton,
			backgrounds.targetCount(),
			decision.rule(),
			backgrounds.letterPair(),
			backgrounds.firstRule(),
			backgrounds.secondRule()
		));
	}

	private static Decision findFakeButton(
		BombEntity bomb, String backing, String leftColor, String rightColor,
		String leftLabel, String rightLabel, String counter
	) {
		if (counter.equals("LEFT_NO_CHANGE")) return new Decision("LEFT", 1);
		if (counter.equals("RIGHT_NO_CHANGE")) return new Decision("RIGHT", 1);
		if (leftColor.equals(backing)) return new Decision("RIGHT", 2);
		if (rightColor.equals(backing)) return new Decision("LEFT", 2);
		if (leftLabel.equals("BUSH_ME") || rightLabel.equals("BUSH_ME")) return new Decision("LEFT", 3);
		if (leftLabel.equals("PUSH_NE") || rightLabel.equals("PUSH_NE")) return new Decision("RIGHT", 4);
		if (leftLabel.equals("PUSH_HE")) return new Decision("LEFT", 5);
		if (rightLabel.equals("PUSH_HE")) return new Decision("RIGHT", 5);
		if (leftLabel.equals("PUSH_SHE")) return new Decision("RIGHT", 6);
		if (rightLabel.equals("PUSH_SHE")) return new Decision("LEFT", 6);
		if (counter.equals("EVENS_HIDDEN")) return new Decision("LEFT", 7);
		if (counter.equals("ODDS_HIDDEN")) return new Decision("RIGHT", 8);
		if (counter.equals("FIVE_HIDDEN") && leftColor.equals("BLACK")) return new Decision("LEFT", 9);
		if (counter.equals("FIVE_HIDDEN") && rightColor.equals("BLACK")) return new Decision("RIGHT", 9);
		return bomb.isLastDigitEven() ? new Decision("RIGHT", 10) : new Decision("LEFT", 11);
	}

	private static String normalizeToken(String value) {
		return BackgroundsSolver.normalize(value).replace(' ', '_').replace('!', '_').replaceAll("_+$", "");
	}

	private record Decision(String fakeButton, int rule) {}
}
