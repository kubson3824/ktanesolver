package ktanesolver.module.modded.regular.digitalcipher;

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
    type = ModuleType.DIGITAL_CIPHER,
    id = "digitalCipher",
    name = "Digital Cipher",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Pair mirrored letters and convert their digital roots into the A–I press sequence.",
    tags = {"cipher", "letters", "digital root", "sequence"}
)
public class DigitalCipherSolver extends AbstractModuleSolver<DigitalCipherInput, DigitalCipherOutput> {
    @Override
    protected SolveResult<DigitalCipherOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, DigitalCipherInput input
    ) {
        if (input == null || input.displayedString() == null) return failure("Enter the displayed string");
        String message = input.displayedString().trim().toUpperCase(Locale.ROOT);
        if (!message.matches("[A-Z]{15}")) return failure("The displayed string must contain exactly 15 letters A-Z");

        StringBuilder presses = new StringBuilder(15);
        for (int i = 0; i < message.length(); i++) {
            int sum = message.charAt(i) - 'A' + message.charAt(message.length() - 1 - i) - 'A';
            int root = sum == 0 ? 0 : 1 + (sum - 1) % 9;
            presses.append((char) ('A' + (root == 0 ? 0 : root - 1)));
        }
        return success(new DigitalCipherOutput(message, presses.toString()));
    }
}
