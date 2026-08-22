package ktanesolver.module.modded.regular.pigpenrotations;

import java.util.Locale;
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
    type = ModuleType.PIGPEN_ROTATIONS,
    id = "pigpenRotations",
    name = "Pigpen Rotations",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Decode twelve pigpen symbols and undo their battery-based Caesar rotation.",
    tags = {"pigpen", "cipher", "rotation", "batteries"}
)
public class PigpenRotationsSolver extends AbstractModuleSolver<PigpenRotationsInput, PigpenRotationsOutput> {
    @Override
    protected SolveResult<PigpenRotationsOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, PigpenRotationsInput input
    ) {
        String displayed = input == null || input.displayed() == null ? "" : input.displayed().trim().toUpperCase(Locale.ROOT);
        if (!displayed.matches("[A-Z]{12}")) return failure("Enter exactly 12 letters decoded from the pigpen symbols");
        int shift = bomb.getBatteryCount() == 0 ? 13 : bomb.getBatteryCount();
        StringBuilder answer = new StringBuilder(12);
        for (char letter : displayed.toCharArray()) answer.append((char) ('A' + Math.floorMod(letter - 'A' - shift, 26)));
        return success(new PigpenRotationsOutput(answer.toString(), shift));
    }
}
