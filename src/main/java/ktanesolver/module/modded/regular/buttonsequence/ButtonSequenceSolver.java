package ktanesolver.module.modded.regular.buttonsequence;

import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Color.*;
import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Label.*;
import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Shape.*;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
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
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Button;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Color;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Label;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Shape;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceOutput.Action;

@Service
@ModuleInfo(
	type = ModuleType.BUTTON_SEQUENCE,
	id = "buttonSequencesModule",
	name = "Button Sequence",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press, skip, or hold each button using cumulative color occurrences across four panels",
	tags = {"buttons", "colors", "shapes", "multi-stage", "souvenir", "modded"}
)
public class ButtonSequenceSolver extends AbstractModuleSolver<ButtonSequenceInput, ButtonSequenceOutput> {
	private static final Map<Color, List<Rule>> RULES = Map.of(
		RED, List.of(rule(ABORT, SQUARE), rule(DETONATE, HEXAGON), rule(HOLD, CIRCLE), rule(ABORT, CIRCLE), rule(PRESS, SQUARE)),
		YELLOW, List.of(rule(DETONATE, CIRCLE), rule(HOLD, HEXAGON), rule(ABORT, SQUARE), rule(PRESS, CIRCLE), rule(HOLD, HEXAGON)),
		BLUE, List.of(rule(HOLD, CIRCLE), rule(ABORT, SQUARE), rule(DETONATE, HEXAGON), rule(PRESS, SQUARE), rule(PRESS, HEXAGON)),
		WHITE, List.of(rule(HOLD, HEXAGON), rule(DETONATE, SQUARE), rule(PRESS, HEXAGON), rule(ABORT, CIRCLE), rule(DETONATE, SQUARE))
	);

	@Override
	protected SolveResult<ButtonSequenceOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ButtonSequenceInput input
	) {
		if (input == null) return failure("Enter the visible panel's three buttons");
		if (input.panel() < 1 || input.panel() > 4) return failure("Button Sequence has exactly 4 panels");
		if (input.buttons() == null || input.buttons().size() != 3) return failure("Enter exactly 3 buttons for the visible panel");
		if (input.buttons().stream().anyMatch(button -> button == null || button.color() == null || button.label() == null || button.shape() == null)) {
			return failure("Select a color, label, and shape for every button");
		}

		ButtonSequenceState state;
		if (input.panel() == 1) {
			state = emptyState();
			module.getState().clear();
		} else {
			try {
				state = module.getStateAs(ButtonSequenceState.class, ButtonSequenceSolver::emptyState);
			} catch (RuntimeException exception) {
				return failure("Saved Button Sequence state is invalid; restart from panel 1");
			}
			if (!validState(state)) return failure("Saved Button Sequence state is invalid; restart from panel 1");
		}
		if (state.completedPanels() != input.panel() - 1) return failure("Enter the panels in order, starting with panel 1");

		EnumMap<Color, Integer> counts = new EnumMap<>(Color.class);
		counts.putAll(state.colorOccurrences());
		List<Action> actions = new ArrayList<>(3);
		for (Button button : input.buttons()) {
			int occurrence = counts.merge(button.color(), 1, Integer::sum);
			Rule rule = RULES.get(button.color()).get((occurrence - 1) % 5);
			boolean labelMatches = button.label() == rule.label();
			boolean shapeMatches = button.shape() == rule.shape();
			actions.add(labelMatches && shapeMatches ? Action.HOLD
				: labelMatches || shapeMatches ? Action.PRESS : Action.SKIP);
		}

		storeTypedState(module, new ButtonSequenceState(input.panel(), counts));
		return success(new ButtonSequenceOutput(input.panel(), List.copyOf(actions), Map.copyOf(counts)), input.panel() == 4);
	}

	private static ButtonSequenceState emptyState() {
		EnumMap<Color, Integer> counts = new EnumMap<>(Color.class);
		for (Color color : Color.values()) counts.put(color, 0);
		return new ButtonSequenceState(0, counts);
	}

	private static boolean validState(ButtonSequenceState state) {
		return state != null && state.completedPanels() >= 0 && state.completedPanels() <= 3
			&& state.colorOccurrences() != null && state.colorOccurrences().keySet().containsAll(List.of(Color.values()))
			&& state.colorOccurrences().values().stream().allMatch(count -> count != null && count >= 0)
			&& state.colorOccurrences().values().stream().mapToInt(Integer::intValue).sum() == state.completedPanels() * 3;
	}

	private static Rule rule(Label label, Shape shape) {
		return new Rule(label, shape);
	}

	private record Rule(Label label, Shape shape) {}
	private record ButtonSequenceState(int completedPanels, Map<Color, Integer> colorOccurrences) {}
}
