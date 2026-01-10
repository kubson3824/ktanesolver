package ktanesolver.module.vanilla.needy.knobs;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class KnobsModuleSolver implements ModuleSolver<KnobsInput, KnobsOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.KNOBS;
    }

    @Override
    public Class<KnobsInput> inputType() {
        return KnobsInput.class;
    }
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("knobs", "Knobs", ModuleCatalogDto.ModuleCategory.VANILLA_NEEDY,
			"KNOBS", List.of("puzzle", "position"),
			"Set the knobs to the correct positions", true, true);
	}

    @Override
    public SolveResult<KnobsOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, KnobsInput input) {
        String position = solveKnob(input.indicators());
        
        KnobsOutput output = new KnobsOutput(position);
        
        // Save the state and solution to the module
        module.setState(Map.of(
            "indicators", input.indicators()
        ));
        module.setSolution(Map.of(
            "position", position
        ));
        module.setSolved(true);
        
        return new SolveSuccess<>(output, true);
    }

    private String solveKnob(boolean[] indicators) {
        // Ensure we have at least 12 indicators
        if (indicators.length < 12) {
            boolean[] extended = new boolean[12];
            System.arraycopy(indicators, 0, extended, 0, indicators.length);
            indicators = extended;
        }

        // Logic from the original NeedyKnobs implementation
        if ((indicators[2] && indicators[4] && indicators[5] && indicators[6] && indicators[7] && indicators[8] && indicators[9] && indicators[11]) || 
            (indicators[0] && indicators[2] && indicators[4] && indicators[7] && indicators[8] && indicators[10] && indicators[11])) {
            return "Up";
        }
        
        if ((indicators[1] && indicators[2] && indicators[5] && indicators[6] && indicators[7] && indicators[8] && indicators[9] && indicators[11]) || 
            (indicators[0] && indicators[2] && indicators[4] && indicators[7] && indicators[11])) {
            return "Down";
        }
        
        if ((indicators[4] && indicators[6] && indicators[9] && indicators[10] && indicators[11]) || 
            (indicators[4] && indicators[9] && indicators[10])) {
            return "Left";
        }
        
        if ((indicators[0] && indicators[2] && indicators[3] && indicators[4] && indicators[5] && indicators[6] && indicators[7] && indicators[8] && indicators[10]) || 
            (indicators[0] && indicators[2] && indicators[3] && indicators[6] && indicators[7] && indicators[8] && indicators[10])) {
            return "Right";
        }
        
        return "Unknown configuration";
    }


}
