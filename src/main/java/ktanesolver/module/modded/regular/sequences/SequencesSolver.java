package ktanesolver.module.modded.regular.sequences;

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
    type = ModuleType.SEQUENCES,
    id = "sequencesModule",
    name = "Sequences",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Derive the simplified linear formula from the first three terms.",
    tags = {"math", "sequence", "formula"}
)
public class SequencesSolver extends AbstractModuleSolver<SequencesInput, SequencesOutput> {
    @Override
    protected SolveResult<SequencesOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, SequencesInput input
    ) {
        if (input == null || input.first() == null || input.second() == null || input.third() == null) {
            return failure("Enter all three displayed terms");
        }
        int coefficient = input.second() - input.first();
        if (input.third() - input.second() != coefficient) {
            return failure("The displayed terms must form an arithmetic sequence");
        }
        int constant = input.first() - coefficient;
        if (coefficient == 0 || coefficient < -99 || coefficient > 99 || constant < -99 || constant > 99) {
            return failure("The sequence must use nonzero A and values from -99 through 99 for A and B");
        }
        return success(new SequencesOutput(coefficient, constant, formula(coefficient, constant)));
    }

    static String formula(int coefficient, int constant) {
        String result = coefficient == 1 ? "n" : coefficient == -1 ? "-n" : coefficient + "n";
        if (constant > 0) return result + "+" + constant;
        return constant < 0 ? result + constant : result;
    }
}
