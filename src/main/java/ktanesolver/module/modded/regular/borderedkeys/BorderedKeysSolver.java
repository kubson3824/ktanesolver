package ktanesolver.module.modded.regular.borderedkeys;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
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
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysInput.Color;
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysInput.Key;
import ktanesolver.module.modded.regular.borderedkeys.BorderedKeysOutput.Action;

@Service
@ModuleInfo(
	type = ModuleType.BORDERED_KEYS,
	id = "borderedKeys",
	name = "Bordered Keys",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode the remaining keys, pressing a valid key or resetting when none remain valid.",
	tags = {"keys", "colors", "numbers", "resets"}
)
public class BorderedKeysSolver extends AbstractModuleSolver<BorderedKeysInput, BorderedKeysOutput> {
	private static final String TABLE =
		"435162352164613254" + "216345136542461532" +
		"521436641325152463" + "362514215436326145" +
		"154623463251534621" + "643251524613245316" +
		"163245326154436521" + "342516615432315246" +
		"621354142365562134" + "516423251643123465" +
		"435162463521241653" + "254631534216654312";

	@Override
	protected SolveResult<BorderedKeysOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BorderedKeysInput input
	) {
		if (input == null || input.keys() == null || input.keys().size() != 6) {
			return failure("Enter all six key positions");
		}
		long pressed = input.keys().stream().filter(key -> key != null && !key.active()).count();
		if (input.pressedBeforeReset() < 0 || input.pressedBeforeReset() > pressed || pressed >= 6) {
			return failure("The number pressed before this layout must be between 0 and the number of inactive keys");
		}
		for (Key key : input.keys()) {
			if (key == null || key.active() && (key.keyColor() == null || key.labelColor() == null ||
				key.borderColor() == null || key.label() == null || key.label() < 1 || key.label() > 6 ||
				key.display() == null || key.display() < 1 || key.display() > 6)) {
				return failure("Enter all five properties for every active key");
			}
		}

		int target = input.pressedBeforeReset() + 1;
		List<Integer> decoded = new ArrayList<>(6);
		List<Integer> valid = new ArrayList<>();
		for (int position = 0; position < 6; position++) {
			Key key = input.keys().get(position);
			if (!key.active()) {
				decoded.add(0);
				continue;
			}
			int value = value(key, position);
			decoded.add(value);
			if (value == target) valid.add(position + 1);
		}

		Action action = valid.isEmpty() ? Action.RESET : Action.PRESS;
		int recommended = action == Action.RESET ? 0 : valid.getFirst();
		if (action == Action.PRESS) storePressedKey(module, recommended - 1, input.keys().get(recommended - 1));
		return success(new BorderedKeysOutput(
			target, decoded, valid, recommended, action, "press " + recommended
		), pressed == 5);
	}

	static int value(Key key, int position) {
		int labelRow = key.label() - 1;
		int positionRow = position + 6;
		int sum = cell(labelRow, key.keyColor().ordinal())
			+ cell(labelRow, key.labelColor().ordinal() + 6)
			+ cell(labelRow, key.borderColor().ordinal() + 12)
			+ cell(positionRow, key.keyColor().ordinal())
			+ cell(positionRow, key.labelColor().ordinal() + 6)
			+ cell(positionRow, key.borderColor().ordinal() + 12);
		return (sum + key.display()) % 6 + 1;
	}

	private static int cell(int row, int column) {
		return TABLE.charAt(row * 18 + column) - '0';
	}

	private void storePressedKey(ModuleEntity module, int position, Key key) {
		List<Object> facts = new ArrayList<>(Collections.nCopies(6, null));
		Object raw = module.getState().get("borderedKeysPressedKeys");
		if (raw instanceof List<?> existing) {
			for (int index = 0; index < Math.min(existing.size(), facts.size()); index++) facts.set(index, existing.get(index));
		}
		Map<String, Object> pressedKey = new LinkedHashMap<>();
		pressedKey.put("keyColor", colorName(key.keyColor()));
		pressedKey.put("labelColor", colorName(key.labelColor()));
		pressedKey.put("borderColor", colorName(key.borderColor()));
		pressedKey.put("label", key.label());
		pressedKey.put("display", key.display());
		facts.set(position, pressedKey);
		storeState(module, "borderedKeysPressedKeys", facts);
	}

	private static String colorName(Color color) {
		String lower = color.name().toLowerCase(Locale.ROOT);
		return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
	}
}
