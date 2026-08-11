package ktanesolver.module.modded.needy.hotpotato;

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
    type = ModuleType.HOT_POTATO,
    id = "HotPotato",
    name = "Hot Potato",
    category = ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
    description = "Drop the bomb before the active needy timer expires.",
    tags = {"needy", "timing", "physical"}
)
public class HotPotatoSolver extends AbstractModuleSolver<HotPotatoInput, HotPotatoOutput> {
    @Override
    protected SolveResult<HotPotatoOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HotPotatoInput input) {
        if (input == null || input.active() == null || input.bombHeld() == null) return failure("Confirm whether the needy is active and whether the bomb is held");
        if (!input.active()) return failure("Wait until Hot Potato activates");
        return success(new HotPotatoOutput(input.bombHeld() ? "DROP_BOMB" : "KEEP_BOMB_DROPPED"), false);
    }
}
