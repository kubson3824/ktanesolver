package ktanesolver.module.modded.regular.quintuples;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
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
import ktanesolver.module.modded.regular.quintuples.QuintuplesInput.Cell;
import ktanesolver.module.modded.regular.quintuples.QuintuplesInput.Color;

@Service
@ModuleInfo(type = ModuleType.QUINTUPLES, id = "quintuples", name = "Quintuples",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Transform five iterations of colored digits and submit the resulting quintuple.",
	tags = {"digits", "colors", "cycling", "arithmetic"})
public class QuintuplesSolver extends AbstractModuleSolver<QuintuplesInput, QuintuplesOutput> {
	private static final List<List<Set<Color>>> MATCHES = List.of(
		List.of(Set.of(Color.RED, Color.ORANGE), Set.of(Color.BLUE), Set.of(Color.ORANGE), Set.of(Color.GREEN), Set.of(Color.PINK, Color.BLUE)),
		List.of(Set.of(Color.BLUE), Set.of(Color.PINK, Color.RED), Set.of(Color.RED), Set.of(Color.ORANGE, Color.PINK), Set.of(Color.GREEN)),
		List.of(Set.of(Color.PINK), Set.of(Color.ORANGE), Set.of(Color.GREEN, Color.ORANGE), Set.of(Color.BLUE, Color.GREEN), Set.of(Color.RED)),
		List.of(Set.of(Color.GREEN), Set.of(Color.RED), Set.of(Color.BLUE, Color.GREEN), Set.of(Color.PINK), Set.of(Color.ORANGE, Color.RED)),
		List.of(Set.of(Color.ORANGE, Color.BLUE), Set.of(Color.GREEN, Color.PINK), Set.of(Color.PINK), Set.of(Color.RED), Set.of(Color.BLUE))
	);

	@Override
	protected SolveResult<QuintuplesOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, QuintuplesInput input) {
		if (input == null || input.cells() == null || input.cells().size() != 25)
			return failure("Enter all 25 cycling digits and colors");
		if (input.cells().stream().anyMatch(cell -> cell == null || cell.color() == null || cell.digit() < 0 || cell.digit() > 9))
			return failure("Every cell needs a digit from 0 to 9 and a color");

		Map<Color, Integer> counts = new EnumMap<>(Color.class);
		for (Color color : Color.values()) counts.put(color, 0);
		input.cells().forEach(cell -> counts.merge(cell.color(), 1, Integer::sum));
		int[] divisors = {
			counts.get(Color.RED) + counts.get(Color.ORANGE),
			counts.get(Color.BLUE) + counts.get(Color.PINK),
			counts.get(Color.RED) + counts.get(Color.GREEN),
			counts.get(Color.BLUE) + counts.get(Color.ORANGE)
		};
		if (java.util.Arrays.stream(divisors).anyMatch(value -> value == 0))
			return failure("This observation gives the source module a zero divisor; recheck the colors");

		int[] sums = new int[5];
		List<Integer> numbers = new ArrayList<>(25);
		List<String> colors = new ArrayList<>(25);
		for (int slot = 0; slot < 5; slot++) for (int iteration = 0; iteration < 5; iteration++) {
			Cell cell = input.cells().get(slot * 5 + iteration);
			int value = cell.digit() == 0 ? 10 : cell.digit();
			if (MATCHES.get(slot).get(iteration).contains(cell.color())) value = transform(slot, value);
			sums[iteration] += value;
			numbers.add(cell.digit());
			colors.add(cell.color().name().toLowerCase());
		}
		String answer = "" + sums[0] % divisors[0] % 10 + sums[1] % divisors[1] % 10
			+ sums[2] % divisors[2] % 10 + sums[3] % divisors[3] % 10
			+ (((sums[4] / 10) % 10) + counts.get(Color.GREEN) + counts.get(Color.PINK)) % 10;
		Map<String, Integer> colorCounts = new java.util.LinkedHashMap<>();
		for (Color color : Color.values()) colorCounts.put(color.name().toLowerCase(), counts.get(color));
		storeState(module, Map.of("quintuplesNumbers", numbers, "quintuplesColors", colors, "quintuplesColorCounts", colorCounts));
		return success(new QuintuplesOutput(answer));
	}

	static int transform(int slot, int value) {
		return switch (slot) { case 0 -> value + 7; case 1 -> value + 13; case 2 -> value * 2; case 3 -> value * 3; default -> value / 2; };
	}
}
