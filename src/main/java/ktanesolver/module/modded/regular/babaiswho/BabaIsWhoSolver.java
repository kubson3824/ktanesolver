package ktanesolver.module.modded.regular.babaiswho;

import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Attribute;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Button;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Character;
import ktanesolver.module.modded.regular.babaiswho.BabaIsWhoInput.Rule;

@Service
@ModuleInfo(type = ModuleType.BABA_IS_WHO, id = "babaIsWho", name = "Baba Is Who?", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Combine the displayed subject and attribute rules and press the resulting character.", tags = {"words", "grid", "edgework"})
public class BabaIsWhoSolver extends AbstractModuleSolver<BabaIsWhoInput, BabaIsWhoOutput> {
	private static final int[][] SUBJECT_OFFSETS = {{0,0},{1,0},{-1,0},{0,-1},{-1,1},{1,1}};
	private static final int[][] ATTRIBUTE_OFFSETS = {{1,0},{-1,0},{0,1},{-1,-1},{0,0},{1,-1}};
	private static final Attribute[] ATTRIBUTE_ANCHORS = {Attribute.DEFEAT, Attribute.STOP, Attribute.YOU, Attribute.WIN, Attribute.MOVE, Attribute.PUSH};

	@Override
	protected SolveResult<BabaIsWhoOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BabaIsWhoInput input) {
		if (input == null || input.rules() == null || input.rules().size() != 6 || input.buttons() == null || input.buttons().size() != 6)
			return failure("Enter all six displayed rules and all six grid buttons in reading order");
		if (input.rules().stream().anyMatch(rule -> rule == null || rule.subject() == null || rule.attribute() == null)
			|| input.buttons().stream().anyMatch(button -> button == null || button.character() == null || button.attribute() == null))
			return failure("Every rule and button needs both a character and an attribute");
		if (new HashSet<>(input.rules().stream().map(Rule::subject).toList()).size() != 6
			|| new HashSet<>(input.rules().stream().map(Rule::attribute).toList()).size() != 6
			|| new HashSet<>(input.buttons().stream().map(Button::character).toList()).size() != 6
			|| new HashSet<>(input.buttons().stream().map(Button::attribute).toList()).size() != 6)
			return failure("Each character and attribute must occur exactly once in the rules and grid");

		int selected = -1;
		Integer appliedRule = null;
		for (int i = 0; i < input.rules().size(); i++) {
			Rule rule = input.rules().get(i);
			if (condition(rule.subject(), value(rule.attribute(), bomb))) {
				selected = moveToRuleTarget(input.buttons(), rule);
				appliedRule = i + 1;
				break;
			}
		}
		if (selected < 0) selected = findAttribute(input.buttons(), Attribute.YOU);
		boolean shifted = input.buttons().get(selected).attribute() == Attribute.DEFEAT;
		if (shifted) selected = move(selected, 0, 1);
		Button answer = input.buttons().get(selected);
		return success(new BabaIsWhoOutput(selected + 1, answer.character(), answer.attribute(), appliedRule, shifted));
	}

	private static int value(Attribute attribute, BombEntity bomb) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase();
		return switch (attribute) {
			case YOU -> bomb.getBatteryCount() % 10;
			case MOVE -> bomb.getLastDigit();
			case DEFEAT -> bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum() % 10;
			case PUSH -> bomb.getIndicators().size() % 10;
			case WIN -> serial.length() > 3 && java.lang.Character.isLetter(serial.charAt(3)) ? (serial.charAt(3) - 'A' + 1) % 10 : 0;
			case STOP -> bomb.getModules().size() % 10;
		};
	}

	private static boolean condition(Character subject, int value) {
		return switch (subject) {
			case BABA -> value > 4;
			case KEKE -> value % 2 == 0;
			case ME -> value > 3 && !prime(value);
			case ROCK -> value % 2 == 1;
			case FLAG -> value < 5;
			case WALL -> prime(value);
		};
	}

	private static boolean prime(int value) { return value == 2 || value == 3 || value == 5 || value == 7; }

	private static int moveToRuleTarget(List<Button> buttons, Rule rule) {
		int anchor = findAttribute(buttons, ATTRIBUTE_ANCHORS[rule.attribute().ordinal()]);
		int[] attributeOffset = ATTRIBUTE_OFFSETS[rule.attribute().ordinal()];
		int target = move(anchor, attributeOffset[0], attributeOffset[1]);
		int[] subjectOffset = SUBJECT_OFFSETS[rule.subject().ordinal()];
		return move(target, subjectOffset[0], subjectOffset[1]);
	}

	private static int findAttribute(List<Button> buttons, Attribute attribute) {
		for (int i = 0; i < buttons.size(); i++) if (buttons.get(i).attribute() == attribute) return i;
		throw new IllegalArgumentException("Missing attribute " + attribute);
	}

	private static int move(int position, int rowOffset, int columnOffset) {
		int row = Math.floorMod(position / 3 + rowOffset, 2);
		int column = Math.floorMod(position % 3 + columnOffset, 3);
		return row * 3 + column;
	}
}
