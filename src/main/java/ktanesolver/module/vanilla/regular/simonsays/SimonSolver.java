
package ktanesolver.module.vanilla.regular.simonsays;

import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class SimonSolver implements ModuleSolver<SimonInput, SimonOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.SIMON_SAYS;
	}

	@Override
	public Class<SimonInput> inputType() {
		return SimonInput.class;
	}
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("simon", "Simon Says", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"SIMON_SAYS", List.of("memory", "pattern"),
			"Repeat the color sequence following the strike count", true, true);
	}

	@Override
	public SolveResult<SimonOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, SimonInput input) {
		boolean hasVowel = bomb.serialHasVowel();
		int strikes = bomb.getStrikes();

		List<SimonColor> presses = input.flashes().stream().map(color -> mapColor(color, hasVowel, strikes)).toList();

		SimonState newState = new SimonState(presses);

		module.setState(newState);
		if(input.flashes().size() == presses.size()) {
			module.setSolved(true);
		}

		return new SolveSuccess<>(new SimonOutput(presses), module.isSolved());
	}

	private SimonColor mapColor(SimonColor flashed, boolean hasVowel, int strikes) {
		int s = Math.min(strikes, 2);

		if(hasVowel) {
			if(flashed == SimonColor.RED) {
				if(s == 0)
					return SimonColor.BLUE;
				if(s == 1)
					return SimonColor.YELLOW;
				return SimonColor.GREEN;
			}
			else if(flashed == SimonColor.BLUE) {
				if(s == 0)
					return SimonColor.RED;
				if(s == 1)
					return SimonColor.GREEN;
				return SimonColor.RED;
			}
			else if(flashed == SimonColor.GREEN) {
				if(s == 0)
					return SimonColor.YELLOW;
				if(s == 1)
					return SimonColor.BLUE;
				return SimonColor.YELLOW;
			}
			else { // YELLOW
				if(s == 0)
					return SimonColor.GREEN;
				if(s == 1)
					return SimonColor.RED;
				return SimonColor.BLUE;
			}
		}
		else {
			if(flashed == SimonColor.RED) {
				if(s == 0)
					return SimonColor.BLUE;
				if(s == 1)
					return SimonColor.RED;
				return SimonColor.YELLOW;
			}
			else if(flashed == SimonColor.BLUE) {
				if(s == 0)
					return SimonColor.YELLOW;
				if(s == 1)
					return SimonColor.BLUE;
				return SimonColor.GREEN;
			}
			else if(flashed == SimonColor.GREEN) {
				if(s == 0)
					return SimonColor.GREEN;
				if(s == 1)
					return SimonColor.YELLOW;
				return SimonColor.BLUE;
			}
			else { // YELLOW
				if(s == 0)
					return SimonColor.RED;
				if(s == 1)
					return SimonColor.GREEN;
				return SimonColor.RED;
			}
		}
	}
}
