package ktanesolver.module.modded.regular.faultydigitalroot;

import java.util.List;
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
    type = ModuleType.FAULTY_DIGITAL_ROOT,
    id = "faultyDigitalRootModule",
    name = "Faulty Digital Root",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Use the broken display to choose an additive or multiplicative digital root.",
    tags = {"math", "binary", "buttons"}
)
public class FaultyDigitalRootSolver extends AbstractModuleSolver<FaultyDigitalRootInput, FaultyDigitalRootOutput> {
    @Override
    protected SolveResult<FaultyDigitalRootOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, FaultyDigitalRootInput input
    ) {
        if (input == null || input.first() == null || input.second() == null
            || input.third() == null || input.faulty() == null) {
            return failure("Enter all four displayed digits");
        }
        if (!digit(input.first()) || !digit(input.second()) || !digit(input.third()) || !digit(input.faulty())) {
            return failure("Every display must contain one digit from 0 through 9");
        }
        int value = input.faulty() % 2 == 0
            ? input.first() + input.second() + input.third()
            : input.first() * input.second() * input.third();
        int root = input.faulty() % 2 == 0 ? additiveRoot(value) : multiplicativeRoot(value);
        String binary = String.format("%4s", Integer.toBinaryString(root)).replace(' ', '0');
        List<String> presses = binary.chars().mapToObj(bit -> bit == '1' ? "YES" : "NO").toList();
        return success(new FaultyDigitalRootOutput(root, binary, presses));
    }

    private static boolean digit(int value) { return value >= 0 && value <= 9; }

    static int additiveRoot(int value) {
        while (value >= 10) {
            int next = 0;
            while (value > 0) { next += value % 10; value /= 10; }
            value = next;
        }
        return value;
    }

    static int multiplicativeRoot(int value) {
        while (value >= 10) {
            int next = 1;
            while (value > 0) { next *= value % 10; value /= 10; }
            value = next;
        }
        return value;
    }
}
