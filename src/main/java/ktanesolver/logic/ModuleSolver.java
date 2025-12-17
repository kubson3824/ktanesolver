package ktanesolver.logic;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;

public interface ModuleSolver<I extends ModuleInput, O extends ModuleOutput> {

    ModuleType getType();
    Class<I> inputType();
    SolveResult<O> solve(
        RoundEntity round,
        BombEntity bomb,
        ModuleEntity module,
        I input
    );
}
