package ktanesolver.module.modded.regular.sillyslots;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;

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
	type = ModuleType.SILLY_SLOTS,
	id = "silly-slots",
	name = "Silly Slots",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press KEEP when the slots are legal, pull the lever when illegal. Module defuses after 4 lever pulls.",
	tags = { "slots", "modded" },
	hasInput = true,
	hasOutput = true
)
public class SillySlotsSolver extends AbstractModuleSolver<SillySlotsInput, SillySlotsOutput> {
	private record Substitutions(
		Slot.Color sassy, Slot.Color silly, Slot.Color soggy,
		Slot.Shape sally, Slot.Shape simon, Slot.Shape sausage, Slot.Shape steven
	) {
		private static Substitutions forKeyword(Keyword keyword) {
			return switch (keyword) {
				case SASSY -> new Substitutions(Slot.Color.BLUE, Slot.Color.RED, Slot.Color.GREEN, Slot.Shape.CHERRY, Slot.Shape.GRAPE, Slot.Shape.BOMB, Slot.Shape.COIN);
				case SILLY -> new Substitutions(Slot.Color.BLUE, Slot.Color.GREEN, Slot.Color.RED, Slot.Shape.COIN, Slot.Shape.BOMB, Slot.Shape.GRAPE, Slot.Shape.CHERRY);
				case SOGGY -> new Substitutions(Slot.Color.GREEN, Slot.Color.BLUE, Slot.Color.RED, Slot.Shape.COIN, Slot.Shape.CHERRY, Slot.Shape.BOMB, Slot.Shape.GRAPE);
				case SALLY -> new Substitutions(Slot.Color.RED, Slot.Color.BLUE, Slot.Color.GREEN, Slot.Shape.GRAPE, Slot.Shape.CHERRY, Slot.Shape.BOMB, Slot.Shape.COIN);
				case SIMON -> new Substitutions(Slot.Color.RED, Slot.Color.GREEN, Slot.Color.BLUE, Slot.Shape.BOMB, Slot.Shape.GRAPE, Slot.Shape.CHERRY, Slot.Shape.COIN);
				case SAUSAGE -> new Substitutions(Slot.Color.RED, Slot.Color.BLUE, Slot.Color.GREEN, Slot.Shape.GRAPE, Slot.Shape.BOMB, Slot.Shape.COIN, Slot.Shape.CHERRY);
				case STEVEN -> new Substitutions(Slot.Color.GREEN, Slot.Color.RED, Slot.Color.BLUE, Slot.Shape.CHERRY, Slot.Shape.BOMB, Slot.Shape.COIN, Slot.Shape.GRAPE);
			};
		}
	}

	@Override
	protected SolveResult<SillySlotsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SillySlotsInput input) {
		if (input == null || input.keyword() == null) return failure("Keyword is required");
		if (input.slots() == null || input.slots().size() != 3) return failure("Exactly 3 slots are required");
		if (input.slots().stream().anyMatch(slot -> slot == null || slot.color() == null || slot.shape() == null)) {
			return failure("Each slot requires a color and symbol");
		}

		SillySlotsState state = module.getStateAs(SillySlotsState.class, SillySlotsState::new);
		List<List<String>> history = state.displayHistory() == null ? List.of() : state.displayHistory();
		List<Slot> slots = List.copyOf(input.slots());
		Integer illegalRule = illegalRule(slots, history, Substitutions.forKeyword(input.keyword()));
		if (illegalRule == null) return success(new SillySlotsOutput(true));

		List<List<String>> nextHistory = new ArrayList<>(history);
		nextHistory.add(slots.stream().map(SillySlotsSolver::label).toList());
		int pulls = state.leverPullCount() + 1;
		storeTypedState(module, new SillySlotsState(pulls, nextHistory));
		return success(new SillySlotsOutput(false, illegalRule), pulls >= 4);
	}

	private static Integer illegalRule(List<Slot> slots, List<List<String>> history, Substitutions s) {
		if (count(slots, slot -> matches(slot, s.silly(), s.sausage())) == 1) return 1;

		List<Integer> sassySally = java.util.stream.IntStream.range(0, 3)
			.filter(i -> matches(slots.get(i), s.sassy(), s.sally())).boxed().toList();
		if (sassySally.size() == 1 && (history.size() < 2
			|| !hasColor(history.get(history.size() - 2).get(sassySally.getFirst()), s.soggy()))) return 2;

		if (count(slots, slot -> matches(slot, s.soggy(), s.steven())) >= 2) return 3;
		if (count(slots, slot -> slot.shape() == s.simon()) == 3 && count(slots, slot -> slot.color() == s.sassy()) == 0) return 4;

		for (int i = 0; i < 2; i++) {
			Slot left = slots.get(i), right = slots.get(i + 1);
			if (left.shape() == s.sausage() && right.shape() == s.sally() && right.color() != s.soggy()
				|| right.shape() == s.sausage() && left.shape() == s.sally() && left.color() != s.soggy()) return 5;
		}

		List<Slot> silly = slots.stream().filter(slot -> slot.color() == s.silly()).toList();
		if (silly.size() == 2 && silly.stream().anyMatch(slot -> slot.shape() != s.steven())) return 6;
		if (count(slots, slot -> slot.color() == s.soggy()) == 1
			&& (history.isEmpty() || history.getLast().stream().noneMatch(slot -> hasShape(slot, s.sausage())))) return 7;
		if (slots.stream().distinct().count() == 1
			&& history.stream().noneMatch(stage -> stage.contains(label(s.soggy(), s.sausage())))) return 8;
		if (count(slots, slot -> slot.color() == slots.getFirst().color()) == 3
			&& slots.stream().noneMatch(slot -> slot.shape() == s.sally())
			&& (history.isEmpty() || !history.getLast().contains(label(s.silly(), s.steven())))) return 9;
		if (slots.stream().anyMatch(slot -> matches(slot, s.silly(), s.simon()))
			&& history.stream().noneMatch(stage -> stage.contains(label(s.sassy(), s.sausage())))) return 10;
		return null;
	}

	private static long count(List<Slot> slots, Predicate<Slot> predicate) {
		return slots.stream().filter(predicate).count();
	}

	private static boolean matches(Slot slot, Slot.Color color, Slot.Shape shape) {
		return slot.color() == color && slot.shape() == shape;
	}

	private static boolean hasColor(String slot, Slot.Color color) {
		return slot.startsWith(color.name().toLowerCase() + " ");
	}

	private static boolean hasShape(String slot, Slot.Shape shape) {
		return slot.endsWith(" " + shape.name().toLowerCase());
	}

	private static String label(Slot slot) {
		return label(slot.color(), slot.shape());
	}

	private static String label(Slot.Color color, Slot.Shape shape) {
		return (color + " " + shape).toLowerCase();
	}
}
