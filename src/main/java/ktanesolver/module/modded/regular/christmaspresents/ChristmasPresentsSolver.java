package ktanesolver.module.modded.regular.christmaspresents;

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
    type = ModuleType.CHRISTMAS_PRESENTS,
    id = "christmasPresents",
    name = "Christmas Presents",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Count five wrapping-paper families and calculate the correct clock hour.",
    tags = {"math", "counting", "timing", "edgework"}
)
public class ChristmasPresentsSolver extends AbstractModuleSolver<ChristmasPresentsInput, ChristmasPresentsOutput> {
    @Override
    protected SolveResult<ChristmasPresentsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ChristmasPresentsInput input
    ) {
        if (input == null || input.auntieMarge() == null || input.uncleSimon() == null || input.cousinBob() == null
            || input.grannyMay() == null || input.greatUncleBertie() == null) return failure("Enter all five family gift counts");
        int[] counts = {input.auntieMarge(), input.uncleSimon(), input.cousinBob(), input.grannyMay(), input.greatUncleBertie()};
        if (java.util.Arrays.stream(counts).anyMatch(n -> n < 0) || java.util.Arrays.stream(counts).sum() != 13) {
            return failure("Gift counts must be non-negative and total exactly 13 presents");
        }
        int x = Math.abs(counts[0] + counts[1] - counts[2]) + bomb.getIndicators().size();
        int difference = Math.abs(counts[3] - counts[4]);
        int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
        int y = (difference == 0 ? 1 : difference) + ports;
        int z = x * y + bomb.getBatteryCount();
        return success(new ChristmasPresentsOutput(x, y, z, z % 14 + 7));
    }
}
