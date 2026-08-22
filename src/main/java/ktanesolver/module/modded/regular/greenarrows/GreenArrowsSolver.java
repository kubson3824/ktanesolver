package ktanesolver.module.modded.regular.greenarrows;

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
    type = ModuleType.GREEN_ARROWS, id = "greenArrowsModule", name = "Green Arrows",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Map each displayed two-digit number to an arrow and complete a streak of seven.",
    tags = {"arrows", "numbers", "streak", "rule seed"}
)
public class GreenArrowsSolver extends AbstractModuleSolver<GreenArrowsInput, GreenArrowsOutput> {
    private static final int[] TABLE = {2,3,0,1,2,0,1,2,0,1,0,0,2,3,0,2,3,0,2,3,1,2,0,1,2,0,1,2,0,1,3,1,2,0,1,2,3,0,1,0,1,3,0,1,0,0,1,2,3,2,0,2,2,0,1,2,3,0,1,3,1,3,0,1,2,0,2,1,2,2,3,1,0,1,0,3,2,3,1,0,1,0,1,0,3,2,0,1,3,2,0,2,2,3,0,2,3,0,2,3};
    private static final String[] DIRECTIONS = {"up", "right", "down", "left"};

    @Override
    protected SolveResult<GreenArrowsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, GreenArrowsInput input) {
        if (input == null || input.displayedNumber() < 0 || input.displayedNumber() > 99) return failure("Enter a displayed number from 00 to 99");
        int streak = input.resetStreak() ? 0 : number(module.getState().get("greenArrowsStreak"));
        streak = Math.min(7, streak + 1);
        storeState(module, "greenArrowsStreak", streak);
        if (streak == 7) storeState(module, "greenArrowsLastNumber", String.format("%02d", input.displayedNumber()));
        GreenArrowsOutput output = new GreenArrowsOutput(DIRECTIONS[TABLE[input.displayedNumber()]], streak, streak == 7);
        return success(output, streak == 7);
    }

    private static int number(Object value) { return value instanceof Number number ? number.intValue() : 0; }
}
