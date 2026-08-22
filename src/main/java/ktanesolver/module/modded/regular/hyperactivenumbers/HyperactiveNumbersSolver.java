package ktanesolver.module.modded.regular.hyperactivenumbers;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
    type = ModuleType.HYPERACTIVE_NUMBERS, id = "lgndHyperactiveNumbers", name = "Hyperactive Numbers",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Determine the required color and parity for the rapidly changing middle number.",
    tags = {"numbers", "colors", "parity", "timing"}
)
public class HyperactiveNumbersSolver extends AbstractModuleSolver<HyperactiveNumbersInput, HyperactiveNumbersOutput> {
    private static final String[][] COLORS = {{"red", "blue"}, {"green", "yellow"}};

    @Override
    protected SolveResult<HyperactiveNumbersOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HyperactiveNumbersInput input) {
        if (input == null || input.leftNumber() < 0 || input.leftNumber() > 99 || input.rightNumber() < 0 || input.rightNumber() > 99)
            return failure("Enter both displayed numbers from 0 through 99");
        String color = COLORS[Math.floorMod(input.leftNumber(), 2)][Math.floorMod(input.rightNumber(), 2)];
        String parity = (input.leftNumber() < 50) == (input.rightNumber() < 50) ? "even" : "odd";
        return success(new HyperactiveNumbersOutput(color, parity, "submit " + color + " " + parity));
    }
}
