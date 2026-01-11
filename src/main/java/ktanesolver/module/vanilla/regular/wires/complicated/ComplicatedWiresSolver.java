
package ktanesolver.module.vanilla.regular.wires.complicated;

import java.util.ArrayList;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
		type = ModuleType.COMPLICATED_WIRES,
		id = "complicated_wires",
		name = "Complicated Wires",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Cut wires based on multiple properties",
		tags = {"puzzle", "logic"}
)
public class ComplicatedWiresSolver extends AbstractModuleSolver<ComplicatedWiresInput, ComplicatedWiresOutput> {

	@Override
	public SolveResult<ComplicatedWiresOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ComplicatedWiresInput input) {
		List<Integer> cut = new ArrayList<>();

		boolean serialEven = bomb.isLastDigitEven();
		boolean hasParallel = bomb.hasPort(PortType.PARALLEL);
		boolean has2Batteries = bomb.getBatteryCount() >= 2;
		for(int i = 0; i < input.wires().size(); i++) {
			if(shouldCut(input.wires().get(i), serialEven, hasParallel, has2Batteries)) {
				cut.add(i + 1);
			}
		}

		storeState(module, "input", input);

		return success(new ComplicatedWiresOutput(cut));
	}

	// ----------------------------------------------------

	private boolean shouldCut(ComplicatedWiresInput.Wire w, boolean serialEven, boolean hasParallel, boolean has2Batteries) {
		// No colors
		boolean red = w.red();
		boolean star = w.star();
		boolean blue = w.blue();
		boolean led = w.led();

		if( !red && !blue) {
			if( !led && !star)
				return true;
			if(!led)
				return true;
			if(!star)
				return false;
			return has2Batteries;
		}

		// Red only
		if(red && !blue) {
			if( !led && !star)
				return serialEven;
			if(!led)
				return true;
			if(!star)
				return has2Batteries;
			return has2Batteries;
		}

		// Blue only
		if(!red) {
			if( !led && !star)
				return serialEven;
			if(!led)
				return false;
			if(!star)
				return hasParallel;
			return hasParallel;
		}

		// Red + Blue
        if (!led && !star)
            return serialEven;
        if(!led)
            return hasParallel;
        if(!star)
            return serialEven;
        return false;

    }
}
