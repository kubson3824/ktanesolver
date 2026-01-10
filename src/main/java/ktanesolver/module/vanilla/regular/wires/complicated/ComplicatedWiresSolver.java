
package ktanesolver.module.vanilla.regular.wires.complicated;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class ComplicatedWiresSolver implements ModuleSolver<ComplicatedWiresInput, ComplicatedWiresOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.COMPLICATED_WIRES;
	}

	@Override
	public Class<ComplicatedWiresInput> inputType() {
		return ComplicatedWiresInput.class;
	}
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("complicated_wires", "Complicated Wires", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"COMPLICATED_WIRES", List.of("puzzle", "logic"),
			"Cut wires based on multiple properties", true, true);
	}

	@Override
	public SolveResult<ComplicatedWiresOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, ComplicatedWiresInput input) {
		List<Integer> cut = new ArrayList<>();

		boolean serialEven = bomb.isLastDigitEven();
		boolean hasParallel = bomb.hasPort(PortType.PARALLEL);
		boolean has2Batteries = bomb.getBatteryCount() >= 2;
		for(int i = 0; i < input.wires().size(); i++) {
			if(shouldCut(input.wires().get(i), serialEven, hasParallel, has2Batteries)) {
				cut.add(i + 1);
			}
		}

		module.setSolved(true);
		module.setState(input);
		ComplicatedWiresOutput complicatedWiresOutput = new ComplicatedWiresOutput(cut);
		Json.mapper().convertValue(complicatedWiresOutput, new TypeReference<Map<String, Object>>() {
		}).forEach(module.getSolution()::put);
		return new SolveSuccess<>(complicatedWiresOutput, true);
	}

	// ----------------------------------------------------

	private boolean shouldCut(ComplicatedWiresInput.Wire w, boolean serialEven, boolean hasParallel, boolean has2Batteries) {
		// No colors
		boolean red = w.red();
		boolean star = w.star();
		boolean blue = w.blue();
		boolean led = w.led();

		if( !red && !blue) {
			if( !led && !w.star())
				return true;
			if( !led && star)
				return true;
			if(led && !w.star())
				return false;
			return has2Batteries;
		}

		// Red only
		if(w.red() && !w.blue()) {
			if( !led && !w.star())
				return serialEven;
			if( !led && w.star())
				return true;
			if(led && !w.star())
				return has2Batteries;
			return has2Batteries;
		}

		// Blue only
		if( !w.red() && w.blue()) {
			if( !led && !w.star())
				return serialEven;
			if( !led && w.star())
				return false;
			if(led && !w.star())
				return hasParallel;
			return hasParallel;
		}

		// Red + Blue
		if(w.red() && w.blue()) {
			if( !led && !w.star())
				return serialEven;
			if( !led && w.star())
				return hasParallel;
			if(led && !w.star())
				return serialEven;
			return false;
		}

		return false;
	}
}
