package ktanesolver.module.modded.regular.painting;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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
import ktanesolver.module.modded.regular.painting.PaintingInput.Cell;
import ktanesolver.module.modded.regular.painting.PaintingOutput.Repaint;

@Service
@ModuleInfo(
	type = ModuleType.PAINTING,
	id = "Painting",
	name = "Painting",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine BOB's color blindness and repaint each affected region.",
	tags = { "colors", "painting", "indicators", "ports", "batteries", "edgework" }
)
public class PaintingSolver extends AbstractModuleSolver<PaintingInput, PaintingOutput> {
	private static final Set<String> COLORS = Set.of(
		"BLACK", "GRAY", "RED", "BROWN", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "PINK"
	);
	private static final Map<String, Map<String, String>> RULESETS = Map.of(
		"Protanomaly", swaps("BLACK", "RED", "BROWN", "GREEN", "ORANGE", "RED", "BLUE", "RED", "GREEN", "ORANGE", "PURPLE", "PINK", "PINK", "PURPLE"),
		"Deuteranomaly", swaps("RED", "GREEN", "BLUE", "PINK", "GREEN", "YELLOW", "YELLOW", "GREEN", "PINK", "GRAY", "PURPLE", "BROWN", "BROWN", "PURPLE"),
		"Tritanopia", swaps("BLUE", "GRAY", "GRAY", "BLUE", "PURPLE", "BLACK", "BLACK", "PURPLE", "GREEN", "BLUE", "ORANGE", "RED", "RED", "ORANGE")
	);

	@Override
	protected SolveResult<PaintingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PaintingInput input
	) {
		if(input == null || input.cells() == null || input.cells().size() != 9) {
			return failure("Enter all nine painting regions");
		}

		List<Cell> cells = new ArrayList<>(9);
		for(Cell cell : input.cells()) {
			if(cell == null || cell.color() == null) return failure("Select a color for every region");
			String color = normalizeColor(cell.color());
			String label = cell.label() == null ? "" : cell.label().strip();
			if(!COLORS.contains(color)) return failure("Use a color shown on Painting's palette");
			if(!label.isEmpty() && !label.matches("[A-Za-z0-9]+")) return failure("Twitch labels may only contain letters and numbers");
			cells.add(new Cell(label, color));
		}

		boolean creativityRule = countPorts(bomb, PortType.DVI) == 2
			&& countPorts(bomb, PortType.RJ45) == 1
			&& bomb.isIndicatorLit("CLR");
		String ruleset = creativityRule ? "Creativity" : determineRuleset(bomb);
		Map<String, String> swaps = creativityRule ? Map.of() : RULESETS.get(ruleset);
		List<Repaint> repaints = new ArrayList<>();
		for(int index = 0; index < cells.size(); index++) {
			Cell cell = cells.get(index);
			String target = creativityRule ? (cell.color().equals("BLACK") ? "RED" : "BLACK") : swaps.get(cell.color());
			if(target != null) repaints.add(new Repaint(index + 1, cell.label(), cell.color(), target));
		}

		PaintingInput normalized = new PaintingInput(cells);
		storeState(module, "input", normalized);
		return success(new PaintingOutput(ruleset, creativityRule, repaints));
	}

	private static String determineRuleset(BombEntity bomb) {
		int total = bomb.getBatteryCount() + bomb.getIndicators().size()
			+ bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum() + 2;
		for(String name : RULESETS.keySet()) if(name.length() == total) return name;

		Set<Integer> indicatorCharacters = new LinkedHashSet<>();
		bomb.getIndicators().keySet().stream()
			.flatMapToInt(label -> label.toUpperCase(Locale.ROOT).chars())
			.forEach(indicatorCharacters::add);
		String winner = null;
		int best = -1;
		boolean tied = false;
		for(String name : List.of("Protanomaly", "Deuteranomaly", "Tritanopia")) {
			int score = (int) name.toUpperCase(Locale.ROOT).chars().filter(indicatorCharacters::contains).count();
			if(score > best) {
				winner = name;
				best = score;
				tied = false;
			}
			else if(score == best) tied = true;
		}
		return tied ? "Protanomaly" : winner;
	}

	private static int countPorts(BombEntity bomb, PortType type) {
		return (int) bomb.getPortPlates().stream().filter(plate -> plate.getPorts().contains(type)).count();
	}

	private static String normalizeColor(String color) {
		String normalized = color.strip().toUpperCase(Locale.ROOT);
		return normalized.equals("GREY") ? "GRAY" : normalized;
	}

	private static Map<String, String> swaps(String... colors) {
		Map<String, String> swaps = new LinkedHashMap<>();
		for(int index = 0; index < colors.length; index += 2) swaps.put(colors[index], colors[index + 1]);
		return Map.copyOf(swaps);
	}
}
