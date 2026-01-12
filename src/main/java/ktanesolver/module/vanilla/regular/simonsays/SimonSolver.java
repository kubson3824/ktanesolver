
package ktanesolver.module.vanilla.regular.simonsays;

import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
		type = ModuleType.SIMON_SAYS,
		id = "simon_says",
		name = "Simon Says",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Repeat the color sequence following the strike count",
		tags = {"memory", "pattern"}
)
public class SimonSolver extends AbstractModuleSolver<SimonInput, SimonOutput> {

	@Override
	public SolveResult<SimonOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SimonInput input) {
		boolean hasVowel = bomb.serialHasVowel();
		int strikes = bomb.getStrikes();

		List<SimonColor> presses = input.flashes().stream().map(color -> mapColor(color, hasVowel, strikes)).toList();


		return success(new SimonOutput(presses), input.flashes().size() == presses.size());
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
