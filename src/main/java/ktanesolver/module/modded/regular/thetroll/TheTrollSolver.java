package ktanesolver.module.modded.regular.thetroll;

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
    type = ModuleType.THE_TROLL, id = "troll", name = "The Troll",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Prepare The Troll, activate it by solving other modules, then press on the battery timer digit.",
    tags = {"button", "timer", "solved modules", "batteries"}
)
public class TheTrollSolver extends AbstractModuleSolver<TheTrollInput, TheTrollOutput> {
    @Override
    protected SolveResult<TheTrollOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheTrollInput input) {
        long total = bomb.getModules().stream().filter(TheTrollSolver::isNonTrollSolvable).count();
        long solved = bomb.getModules().stream().filter(TheTrollSolver::isNonTrollSolvable).filter(ModuleEntity::isSolved).count();
        int prep = (int) (total % 13 + solved % 7 + 1);
        int remaining = (int) Math.max(0, total - solved);
        int additionalSolves = remaining <= 1 ? 0 : 2;
        int timerDigit = Math.floorMod(bomb.getBatteryCount(), 10);
        return success(new TheTrollOutput(prep, additionalSolves, timerDigit, "press " + prep, "press at " + timerDigit));
    }

    private static boolean isNonTrollSolvable(ModuleEntity candidate) {
        return candidate.getType() != null && candidate.getType() != ModuleType.THE_TROLL && !candidate.getType().isNeedy();
    }
}
