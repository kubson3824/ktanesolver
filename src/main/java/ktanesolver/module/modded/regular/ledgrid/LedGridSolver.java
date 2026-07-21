package ktanesolver.module.modded.regular.ledgrid;

import static ktanesolver.module.modded.regular.ledgrid.LedGridInput.Color.*;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
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
import ktanesolver.module.modded.regular.ledgrid.LedGridInput.Color;

@Service
@ModuleInfo(
	type = ModuleType.LED_GRID,
	id = "ledGrid",
	name = "LED Grid",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press four buttons in order from a 3×3 grid of colored LEDs",
	tags = {"grid", "colors", "leds", "buttons", "modded"}
)
public class LedGridSolver extends AbstractModuleSolver<LedGridInput, LedGridOutput> {
	@Override
	protected SolveResult<LedGridOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LedGridInput input
	) {
		if (input.colors() == null || input.colors().size() != 9 || input.colors().stream().anyMatch(Objects::isNull)) {
			return failure("Select a color for all 9 LEDs");
		}

		List<Color> colors = input.colors();
		Map<Color, Long> counts = new EnumMap<>(Color.class);
		Arrays.stream(Color.values()).forEach(color -> counts.put(color, colors.stream().filter(color::equals).count()));
		int unlit = counts.get(UNLIT).intValue();
		if (unlit > 4) return failure("LED Grid can have at most 4 unlit LEDs");

		long pairs = counts.values().stream().filter(count -> count == 2).count();
		boolean topSame = colors.subList(0, 3).stream().distinct().count() == 1;
		boolean middleSame = colors.subList(3, 6).stream().distinct().count() == 1;
		boolean bottomSame = colors.subList(6, 9).stream().distinct().count() == 1;
		String answer = switch (unlit) {
			case 0 -> counts.get(ORANGE) == 0 ? "CDAB"
				: counts.get(RED) >= 3 ? "DACB"
				: pairs >= 2 ? "BACD"
				: bottomSame ? "ACDB" : "BCDA";
			case 1 -> counts.values().stream().filter(count -> count == 1).count() == 9 ? "DCBA"
				: topSame ? "ADBC"
				: counts.get(RED) == 3 || counts.get(PINK) == 3 || counts.get(PURPLE) == 3 ? "CBAD"
				: counts.get(WHITE) == 1 || counts.get(BLUE) == 2 || counts.get(YELLOW) == 3 ? "BADC" : "DBAC";
			case 2 -> counts.get(PURPLE) >= 3 ? "ADCB"
				: pairs == 2 ? "BCAD"
				: counts.get(WHITE) > 0 && counts.get(ORANGE) > 0 && counts.get(PINK) > 0 ? "DBCA"
				: counts.get(GREEN) == 1 || counts.get(YELLOW) == 2 || counts.get(RED) == 3 || counts.get(BLUE) == 4 ? "CADB" : "CDBA";
			case 3 -> counts.get(ORANGE) == 2 ? "BDAC"
				: pairs > 1 ? "CABD"
				: counts.get(PURPLE) == 0 ? "DCAB"
				: counts.get(RED) > 0 && counts.get(YELLOW) > 0 ? "ACBD" : "BDCA";
			case 4 -> middleSame ? "BCDA"
				: counts.get(GREEN) >= 2 ? "ABDC"
				: pairs == 2 ? "CBDA"
				: counts.get(PINK) == 0 ? "DABC" : "ABCD";
			default -> throw new IllegalStateException();
		};

		storeState(module, "unlitCount", unlit);
		return success(new LedGridOutput(answer.chars().mapToObj(c -> String.valueOf((char)c)).toList(), unlit));
	}
}
