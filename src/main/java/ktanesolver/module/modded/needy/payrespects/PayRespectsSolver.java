package ktanesolver.module.modded.needy.payrespects;

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
    type = ModuleType.PAY_RESPECTS,
    id = "lgndPayRespects",
    name = "Pay Respects",
    category = ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
    description = "Keep the active needy timer topped up by repeatedly pressing F.",
    tags = {"needy", "timing", "button"}
)
public class PayRespectsSolver extends AbstractModuleSolver<PayRespectsInput, PayRespectsOutput> {
    @Override
    protected SolveResult<PayRespectsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, PayRespectsInput input
    ) {
        if (input == null || !Boolean.TRUE.equals(input.active())) {
            return failure("Wait until Pay Respects is active before pressing F");
        }
        return success(new PayRespectsOutput("Press F repeatedly until the timer is topped up to 30 seconds"), false);
    }
}
