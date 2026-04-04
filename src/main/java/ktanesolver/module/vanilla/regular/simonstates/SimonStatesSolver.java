
package ktanesolver.module.vanilla.regular.simonstates;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@ModuleInfo(
	type = ModuleType.SIMON_STATES,
	id = "simon_states",
	name = "Simon States",
	category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
	description = "Four-stage colour sequence puzzle using a priority table based on the top-left button colour",
	tags = {"blue", "red", "yellow", "green", "blinking", "stages", "priority"}
)
public class SimonStatesSolver extends AbstractModuleSolver<SimonStatesInput, SimonStatesOutput> {

	// Priority rows keyed by top-left button colour (index 0 = highest priority)
	private static final List<SimonStatesColor> PRIORITY_RED    = List.of(SimonStatesColor.RED,    SimonStatesColor.BLUE,   SimonStatesColor.GREEN,  SimonStatesColor.YELLOW);
	private static final List<SimonStatesColor> PRIORITY_BLUE   = List.of(SimonStatesColor.YELLOW, SimonStatesColor.GREEN,  SimonStatesColor.BLUE,   SimonStatesColor.RED);
	private static final List<SimonStatesColor> PRIORITY_GREEN  = List.of(SimonStatesColor.GREEN,  SimonStatesColor.RED,    SimonStatesColor.YELLOW, SimonStatesColor.BLUE);
	private static final List<SimonStatesColor> PRIORITY_YELLOW = List.of(SimonStatesColor.BLUE,   SimonStatesColor.YELLOW, SimonStatesColor.RED,    SimonStatesColor.GREEN);

	@Override
	protected SolveResult<SimonStatesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonStatesInput input
	) {
		SimonStatesState state = module.getStateAs(
			SimonStatesState.class, () -> new SimonStatesState(new ArrayList<>(), input.topLeft())
		);

		if (input.stage() != state.pressHistory().size() + 1) {
			return failure("Invalid stage order");
		}

		List<SimonStatesColor> priority = priorityFor(state.topLeft());
		Set<SimonStatesColor> flashed = new HashSet<>(input.flashes());

		SimonStatesColor press = switch (input.stage()) {
			case 1 -> solveStage1(flashed, priority);
			case 2 -> solveStage2(flashed, priority, state.pressHistory().get(0));
			case 3 -> solveStage3(flashed, priority, state.pressHistory().get(0), state.pressHistory().get(1));
			case 4 -> solveStage4(flashed, priority, state.pressHistory().get(0), state.pressHistory().get(1), state.pressHistory().get(2));
			default -> throw new IllegalStateException("Simon States has only 4 stages");
		};

		List<SimonStatesColor> newHistory = new ArrayList<>(state.pressHistory());
		newHistory.add(press);
		module.setState(new SimonStatesState(newHistory, state.topLeft()));

		return success(new SimonStatesOutput(press), input.stage() == 4);
	}

	private List<SimonStatesColor> priorityFor(SimonStatesColor topLeft) {
		return switch (topLeft) {
			case RED    -> PRIORITY_RED;
			case BLUE   -> PRIORITY_BLUE;
			case GREEN  -> PRIORITY_GREEN;
			case YELLOW -> PRIORITY_YELLOW;
		};
	}

	// Stage 1
	private SimonStatesColor solveStage1(Set<SimonStatesColor> flashed, List<SimonStatesColor> p) {
		int count = flashed.size();
		if (count == 1) {
			return flashed.iterator().next();
		}
		if (count == 2) {
			if (flashed.contains(SimonStatesColor.BLUE)) {
				return highestIn(p, flashed);
			}
			return SimonStatesColor.BLUE;
		}
		if (count == 3) {
			if (flashed.contains(SimonStatesColor.RED)) {
				return lowestIn(p, flashed);
			}
			return SimonStatesColor.RED;
		}
		// 4 colours: second highest
		return p.get(1);
	}

	// Stage 2
	private SimonStatesColor solveStage2(Set<SimonStatesColor> flashed, List<SimonStatesColor> p, SimonStatesColor press1) {
		int count = flashed.size();
		if (count == 2 && flashed.contains(SimonStatesColor.RED) && flashed.contains(SimonStatesColor.BLUE)) {
			return highestIn(p, complement(flashed));
		}
		if (count == 2) {
			return lowestIn(p, complement(flashed));
		}
		if (count == 1) {
			SimonStatesColor color = flashed.iterator().next();
			return color == SimonStatesColor.BLUE ? SimonStatesColor.YELLOW : SimonStatesColor.BLUE;
		}
		if (count == 4) {
			return press1;
		}
		// 3 colours: exactly one didn't flash
		return complement(flashed).iterator().next();
	}

	// Stage 3
	private SimonStatesColor solveStage3(Set<SimonStatesColor> flashed, List<SimonStatesColor> p, SimonStatesColor press1, SimonStatesColor press2) {
		int count = flashed.size();
		Set<SimonStatesColor> prevPressed = new HashSet<>(Set.of(press1, press2));

		if (count == 3) {
			boolean anyPrevPressed = flashed.stream().anyMatch(prevPressed::contains);
			if (anyPrevPressed) {
				Set<SimonStatesColor> unpressed = new HashSet<>(flashed);
				unpressed.removeAll(prevPressed);
				return highestIn(p, unpressed);
			}
			return highestIn(p, flashed);
		}
		if (count == 2) {
			if (flashed.stream().allMatch(prevPressed::contains)) {
				return lowestIn(p, complement(flashed));
			}
			return press1;
		}
		if (count == 1) {
			return flashed.iterator().next();
		}
		// 4 colours: second lowest
		return p.get(2);
	}

	// Stage 4
	private SimonStatesColor solveStage4(Set<SimonStatesColor> flashed, List<SimonStatesColor> p, SimonStatesColor press1, SimonStatesColor press2, SimonStatesColor press3) {
		int count = flashed.size();
		Set<SimonStatesColor> prevPressed = new HashSet<>(Set.of(press1, press2, press3));

		if (prevPressed.size() == 3) {
			for (SimonStatesColor color : SimonStatesColor.values()) {
				if (!prevPressed.contains(color)) {
					return color;
				}
			}
		}
		if (count == 3) {
			Set<SimonStatesColor> unpressed = new HashSet<>(flashed);
			unpressed.removeAll(prevPressed);
			if (unpressed.size() == 1) {
				return unpressed.iterator().next();
			}
		}
		if (count >= 3) {
			return lowestIn(p, flashed);
		}
		if (count == 1) {
			return flashed.iterator().next();
		}
		return SimonStatesColor.GREEN;
	}

	private SimonStatesColor highestIn(List<SimonStatesColor> priority, Set<SimonStatesColor> candidates) {
		for (SimonStatesColor color : priority) {
			if (candidates.contains(color)) {
				return color;
			}
		}
		throw new IllegalStateException("No candidate found in priority list");
	}

	private SimonStatesColor lowestIn(List<SimonStatesColor> priority, Set<SimonStatesColor> candidates) {
		SimonStatesColor result = null;
		for (SimonStatesColor color : priority) {
			if (candidates.contains(color)) {
				result = color;
			}
		}
		if (result == null) {
			throw new IllegalStateException("No candidate found in priority list");
		}
		return result;
	}

	private Set<SimonStatesColor> complement(Set<SimonStatesColor> flashed) {
		Set<SimonStatesColor> all = new HashSet<>(Set.of(SimonStatesColor.values()));
		all.removeAll(flashed);
		return all;
	}
}
