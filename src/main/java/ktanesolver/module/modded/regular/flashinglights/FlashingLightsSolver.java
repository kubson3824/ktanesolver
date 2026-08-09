package ktanesolver.module.modded.regular.flashinglights;

import java.util.EnumMap;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

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
	type = ModuleType.FLASHING_LIGHTS,
	id = "flashingLights",
	name = "Flashing Lights",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Weight the twelve colors flashed by each LED and press the two resulting buttons.",
	tags = {"led", "colors", "counting", "sequences"}
)
public class FlashingLightsSolver extends AbstractModuleSolver<FlashingLightsInput, FlashingLightsOutput> {
	private static final int[] TOP = {4, 2, 3, 6, 1};
	private static final int[] BOTTOM = {2, 7, 6, 9, 3};

	@Override
	protected SolveResult<FlashingLightsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FlashingLightsInput input
	) {
		if (input == null || !valid(input.top()) || !valid(input.bottom()))
			return failure("Enter all 12 flashes for both LEDs");
		Map<FlashingLightsColor, Integer> topCounts = counts(input.top());
		Map<FlashingLightsColor, Integer> bottomCounts = counts(input.bottom());
		Map<String, Object> facts = new HashMap<>();
		for (FlashingLightsColor color : FlashingLightsColor.values()) {
			facts.put("top" + title(color), topCounts.get(color));
			facts.put("bottom" + title(color), bottomCounts.get(color));
		}
		storeState(module, facts);
		return success(new FlashingLightsOutput(
			List.of(answer(topCounts, TOP), answer(bottomCounts, BOTTOM)), topCounts, bottomCounts));
	}

	private static boolean valid(List<FlashingLightsColor> sequence) {
		return sequence != null && sequence.size() == 12 && sequence.stream().noneMatch(Objects::isNull);
	}

	static int answer(Map<FlashingLightsColor, Integer> counts, int[] weights) {
		int total = 0;
		for (FlashingLightsColor color : FlashingLightsColor.values()) total += counts.getOrDefault(color, 0) * weights[color.ordinal()];
		return total % 5 + 1;
	}

	private static Map<FlashingLightsColor, Integer> counts(List<FlashingLightsColor> sequence) {
		Map<FlashingLightsColor, Integer> result = new EnumMap<>(FlashingLightsColor.class);
		for (FlashingLightsColor color : FlashingLightsColor.values()) result.put(color, 0);
		for (FlashingLightsColor color : sequence) result.merge(color, 1, Integer::sum);
		return result;
	}

	private static String title(FlashingLightsColor color) {
		String value = color.name().toLowerCase();
		return Character.toUpperCase(value.charAt(0)) + value.substring(1);
	}
}
