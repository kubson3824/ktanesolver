package ktanesolver.module.modded.regular.buttongrid;

import static ktanesolver.module.modded.regular.buttongrid.ButtonGridInput.Color.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
import ktanesolver.module.modded.regular.buttongrid.ButtonGridInput.Color;

@Service
@ModuleInfo(type = ModuleType.BUTTON_GRID, id = "buttonGrid", name = "Button Grid",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the five color orders and choose a distinct grid button for every press.",
	tags = {"buttons", "colors", "grid", "stages", "edgework"})
public class ButtonGridSolver extends AbstractModuleSolver<ButtonGridInput, ButtonGridOutput> {
	@Override protected SolveResult<ButtonGridOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ButtonGridInput input) {
		if (input == null || input.colors() == null || input.colors().size() != 20 || input.colors().stream().anyMatch(c -> c == null))
			return failure("Enter all 20 button colors in reading order");
		List<Color> grid = List.copyOf(input.colors());
		for (Color color : Color.values()) if (grid.stream().filter(color::equals).count() != 5)
			return failure("Each color must occur exactly five times");
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (bomb.isIndicatorLit("BOB") && bomb.hasPort(PortType.DVI) && bomb.getBatteryCount() == 1
			&& serial.chars().anyMatch(c -> "CHRIS".indexOf(c) >= 0)) {
			List<Color> order = List.of(BLUE, RED, BLUE, YELLOW);
			return success(new ButtonGridOutput(select(grid, order), List.of(order), true));
		}
		List<List<Color>> orders = List.of(stage1(grid), stage2(grid), stage3(serial), stage4(grid.getFirst()), stage5(grid.getLast()));
		List<Color> all = orders.stream().flatMap(List::stream).toList();
		return success(new ButtonGridOutput(select(grid, all), orders, false));
	}

	private static List<Integer> select(List<Color> grid, List<Color> order) {
		Set<Integer> used = new HashSet<>(); List<Integer> result = new ArrayList<>();
		for (Color color : order) for (int i = 0; i < grid.size(); i++) if (!used.contains(i) && grid.get(i) == color) {
			used.add(i); result.add(i + 1); break;
		}
		return List.copyOf(result);
	}
	static List<Color> stage1(List<Color> g) {
		if (new HashSet<>(List.of(g.get(0), g.get(4), g.get(15), g.get(19))).size() == 4) return List.of(RED, BLUE, YELLOW, GREEN);
		for (int c = 0; c < 5; c++) if (new HashSet<>(List.of(g.get(c), g.get(c + 5), g.get(c + 10), g.get(c + 15))).size() == 4) return List.of(GREEN, RED, YELLOW, BLUE);
		for (int r = 0; r < 4; r++) if (new HashSet<>(g.subList(r * 5, r * 5 + 5)).size() != 4) return List.of(RED, YELLOW, BLUE, GREEN);
		return List.of(GREEN, YELLOW, BLUE, RED);
	}
	static List<Color> stage2(List<Color> g) {
		if (g.subList(0, 10).stream().filter(BLUE::equals).count() == 5) return List.of(BLUE, RED, YELLOW, GREEN);
		if (g.subList(10, 20).stream().filter(RED::equals).count() >= 3) return List.of(RED, GREEN, YELLOW, BLUE);
		for (int i = 0; i < 20; i++) if (g.get(i) == GREEN && ((i % 5 > 0 && g.get(i - 1) == GREEN) || (i % 5 < 4 && g.get(i + 1) == GREEN) || (i >= 5 && g.get(i - 5) == GREEN) || (i < 15 && g.get(i + 5) == GREEN))) return List.of(GREEN, BLUE, RED, YELLOW);
		return List.of(YELLOW, RED, BLUE, GREEN);
	}
	static List<Color> stage3(String serial) {
		if (serial.chars().anyMatch(c -> "BTN".indexOf(c) >= 0)) return List.of(GREEN, BLUE, RED, YELLOW);
		if (serial.chars().anyMatch(c -> "GRD".indexOf(c) >= 0)) return List.of(RED, GREEN, BLUE, YELLOW);
		if (serial.chars().anyMatch(c -> "AEIOU".indexOf(c) >= 0)) return List.of(BLUE, GREEN, RED, YELLOW);
		return List.of(YELLOW, RED, GREEN, BLUE);
	}
	static List<Color> stage4(Color color) { return switch (color) {
		case RED -> List.of(RED, YELLOW, GREEN, BLUE); case GREEN -> List.of(GREEN, RED, BLUE, YELLOW);
		case YELLOW -> List.of(YELLOW, RED, GREEN, BLUE); case BLUE -> List.of(BLUE, RED, YELLOW, GREEN);
	}; }
	static List<Color> stage5(Color color) { return switch (color) {
		case YELLOW -> List.of(RED, BLUE, GREEN, YELLOW); case GREEN -> List.of(BLUE, YELLOW, RED, GREEN);
		case BLUE -> List.of(GREEN, YELLOW, RED, BLUE); case RED -> List.of(YELLOW, BLUE, GREEN, RED);
	}; }
}
