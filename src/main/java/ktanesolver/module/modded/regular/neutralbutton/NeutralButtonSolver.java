package ktanesolver.module.modded.regular.neutralbutton;

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
    type = ModuleType.THE_NEUTRAL_BUTTON,
    id = "NeutralButtonModule",
    name = "The Neutral Button",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Press the button during its half-second blink window.",
    tags = {"button", "timing"},
    hasInput = false
)
public class NeutralButtonSolver extends AbstractModuleSolver<NeutralButtonInput, NeutralButtonOutput> {
    @Override
    protected SolveResult<NeutralButtonOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, NeutralButtonInput input
    ) {
        return success(new NeutralButtonOutput("BLINK", 500));
    }
}
