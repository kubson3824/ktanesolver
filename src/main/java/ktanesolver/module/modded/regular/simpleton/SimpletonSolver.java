package ktanesolver.module.modded.regular.simpleton;

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
    type = ModuleType.SIMPLETON,
    id = "SimpleButton",
    name = "The Simpleton",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Push and release the module's button.",
    tags = {"button", "trivial"},
    hasInput = false
)
public class SimpletonSolver extends AbstractModuleSolver<SimpletonInput, SimpletonOutput> {
    @Override
    protected SolveResult<SimpletonOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SimpletonInput input
    ) {
        return success(new SimpletonOutput("PUSH"));
    }
}
