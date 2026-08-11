package ktanesolver.module.modded.regular.horriblememory;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.horriblememory.HorribleMemoryInput.Button;

@Service
@ModuleInfo(type = ModuleType.HORRIBLE_MEMORY, id = "horribleMemory", name = "Horrible Memory",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Track five changing six-button stages and press the position selected by the displayed rule.",
	tags = {"memory", "display", "buttons", "colors", "five-stages"})
public class HorribleMemorySolver extends AbstractModuleSolver<HorribleMemoryInput, HorribleMemoryOutput> {
	@Override protected SolveResult<HorribleMemoryOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HorribleMemoryInput input) {
		if (input == null || input.buttons() == null || input.buttons().size() != 6) return failure("Enter all six buttons from left to right");
		if (input.stage() < 1 || input.stage() > 5 || input.display() < 1 || input.display() > 6) return failure("Stage and display must be between 1 and 5/6 respectively");
		if (input.buttons().stream().anyMatch(button -> button == null || button.color() == null || button.label() < 1 || button.label() > 6)) return failure("Every button needs a label and color");
		Set<Integer> labels = input.buttons().stream().map(Button::label).collect(Collectors.toSet());
		Set<HorribleMemoryColor> colors = input.buttons().stream().map(Button::color).collect(Collectors.toSet());
		if (!labels.equals(Set.of(1, 2, 3, 4, 5, 6)) || !colors.equals(EnumSet.allOf(HorribleMemoryColor.class))) return failure("Labels 1–6 and all six colors must each appear exactly once");
		if (input.restartAttempt() && input.stage() != 1) return failure("A restarted attempt must begin at stage 1");

		List<Map<String, Object>> history = input.restartAttempt() ? new ArrayList<>() : history(module);
		int expectedStage = history.size() + 1;
		if (input.stage() != expectedStage) return failure("Expected stage " + expectedStage);

		Target target = target(input.stage(), input.display(), history);
		int index = switch (target.kind()) {
			case POSITION -> target.number() - 1;
			case LABEL -> indexOfLabel(input.buttons(), target.number());
			case COLOR -> indexOfColor(input.buttons(), target.color());
		};
		Button pressed = input.buttons().get(index);
		Map<String, Object> observation = new LinkedHashMap<>();
		observation.put("display", input.display());
		observation.put("buttons", input.buttons().stream().map(button -> Map.<String, Object>of("label", button.label(), "color", button.color().name().toLowerCase())).toList());
		observation.put("pressedPosition", index + 1);
		observation.put("pressedLabel", pressed.label());
		observation.put("pressedColor", pressed.color().name().toLowerCase());
		history.add(observation);
		module.setState(new HashMap<>(Map.of("completedStages", input.stage(), "stages", history)));
		return success(new HorribleMemoryOutput(input.stage(), index + 1, pressed.label(), pressed.color().name().toLowerCase()), input.stage() == 5);
	}

	private static Target target(int stage, int display, List<Map<String, Object>> h) {
		return switch (stage) {
			case 1 -> switch (display) {
				case 1 -> label(6); case 2 -> position(1); case 3 -> color("green");
				case 4 -> position(3); case 5 -> label(2); default -> color("orange");
			};
			case 2 -> switch (display) {
				case 1 -> position(number(h, 0, "pressedPosition")); case 2 -> color("purple"); case 3 -> label(1);
				case 4 -> label(number(h, 0, "pressedLabel")); case 5 -> position(6); default -> color(text(h, 0, "pressedColor"));
			};
			case 3 -> switch (display) {
				case 1 -> label(buttonNumber(h, 0, 3, "label")); case 2 -> position(positionOf(h, 1, "color", "green"));
				case 3 -> color(buttonTextBy(h, 1, "label", 5, "color")); case 4 -> label(buttonNumber(h, 0, 0, "label"));
				case 5 -> position(number(h, 1, "pressedPosition")); default -> color(buttonText(h, 0, 2, "color"));
			};
			case 4 -> switch (display) {
				case 1 -> position(positionOf(h, 0, "label", 2)); case 2 -> label(buttonNumber(h, 2, 1, "label"));
				case 3 -> color(text(h, 1, "pressedColor")); case 4 -> position(number(h, 2, "pressedPosition"));
				case 5 -> color(buttonTextBy(h, 0, "label", 4, "color")); default -> label(buttonNumber(h, 2, 5, "label"));
			};
			case 5 -> switch (display) {
				case 1 -> color(buttonText(h, 3, 2, "color")); case 2 -> position(positionOf(h, 2, "label", 6));
				case 3 -> label(number(h, 3, "pressedLabel")); case 4 -> label(Integer.parseInt(buttonTextBy(h, 0, "color", "red", "label")));
				case 5 -> color(text(h, 2, "pressedColor")); default -> position(positionOf(h, 1, "color", "blue"));
			};
			default -> throw new IllegalArgumentException("Invalid stage");
		};
	}

	@SuppressWarnings("unchecked") private static List<Map<String, Object>> history(ModuleEntity module) {
		Object stored = module.getState().get("stages");
		return stored instanceof List<?> list ? new ArrayList<>((List<Map<String, Object>>) list) : new ArrayList<>();
	}
	private static int indexOfLabel(List<Button> buttons, int label) { for (int i = 0; i < 6; i++) if (buttons.get(i).label() == label) return i; throw new IllegalStateException(); }
	private static int indexOfColor(List<Button> buttons, String color) { for (int i = 0; i < 6; i++) if (buttons.get(i).color().name().equalsIgnoreCase(color)) return i; throw new IllegalStateException(); }
	private static int number(List<Map<String, Object>> h, int stage, String key) { return ((Number) h.get(stage).get(key)).intValue(); }
	private static String text(List<Map<String, Object>> h, int stage, String key) { return String.valueOf(h.get(stage).get(key)); }
	@SuppressWarnings("unchecked") private static Map<String, Object> button(List<Map<String, Object>> h, int stage, int position) { return (Map<String, Object>) ((List<?>) h.get(stage).get("buttons")).get(position); }
	private static int buttonNumber(List<Map<String, Object>> h, int stage, int position, String key) { return ((Number) button(h, stage, position).get(key)).intValue(); }
	private static String buttonText(List<Map<String, Object>> h, int stage, int position, String key) { return String.valueOf(button(h, stage, position).get(key)); }
	private static int positionOf(List<Map<String, Object>> h, int stage, String key, Object value) { for (int i = 0; i < 6; i++) if (String.valueOf(button(h, stage, i).get(key)).equalsIgnoreCase(String.valueOf(value))) return i + 1; throw new IllegalStateException(); }
	private static String buttonTextBy(List<Map<String, Object>> h, int stage, String searchKey, Object value, String resultKey) { return String.valueOf(button(h, stage, positionOf(h, stage, searchKey, value) - 1).get(resultKey)); }
	private static Target position(int value) { return new Target(Kind.POSITION, value, null); }
	private static Target label(int value) { return new Target(Kind.LABEL, value, null); }
	private static Target color(String value) { return new Target(Kind.COLOR, 0, value); }
	private enum Kind { POSITION, LABEL, COLOR }
	private record Target(Kind kind, int number, String color) {}
}
