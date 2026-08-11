package ktanesolver.module.modded.regular.numbernimbleness;

import java.util.HashSet;
import java.util.List;
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
    type = ModuleType.NUMBER_NIMBLENESS,
    id = "numberNimbleness",
    name = "Number Nimbleness",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Find the next digit in one of five timed number minigames.",
    tags = {"numbers", "timing", "sequence", "multi-stage"}
)
public class NumberNimblenessSolver extends AbstractModuleSolver<NumberNimblenessInput, NumberNimblenessOutput> {
    private static final List<Integer> NIFTY_ORDER = List.of(8, 3, 4, 7, 2, 0, 9, 1, 5, 6);

    @Override
    protected SolveResult<NumberNimblenessOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, NumberNimblenessInput input
    ) {
        if (input == null || input.stage() == null || input.miniGame() == null || input.display() == null
            || input.availableDigits() == null || input.sequenceIndex() == null) {
            return failure("Enter the current stage, minigame, display, remaining buttons, and sequence index");
        }
        if (input.stage() < 1 || input.stage() > 3) return failure("The win number must be from 1 through 3");
        if (input.display() < 0 || input.display() > 9) return failure("The display must be a single digit");
        if (input.availableDigits().isEmpty() || input.availableDigits().size() > 6
            || input.availableDigits().stream().anyMatch(d -> d == null || d < 0 || d > 9)
            || new HashSet<>(input.availableDigits()).size() != input.availableDigits().size()) {
            return failure("Enter one through six distinct remaining digits from 0 through 9");
        }
        if (input.sequenceIndex() < 1) return failure("The sequence index must be at least 1");

        String game = input.miniGame().trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        int used = input.sequenceIndex();
        int target;
        switch (game) {
            case "NAGGING_NUMBERS" -> target = input.display();
            case "NONARY_NUMBERS" -> target = 9 - input.display();
            case "NIFTY_NUMBERS" -> {
                target = NIFTY_ORDER.stream().filter(input.availableDigits()::contains).findFirst().orElseThrow();
                used = NIFTY_ORDER.indexOf(target) + 1;
            }
            case "NEBULOUS_NUMBERS" -> {
                while (!input.availableDigits().contains(Math.floorMod(input.display() + used, 10))) used++;
                target = Math.floorMod(input.display() + used, 10);
            }
            case "NUISANCE_NUMBERS" -> {
                while (Math.floorMod(input.display() * used, 11) == 10
                    || !input.availableDigits().contains(Math.floorMod(input.display() * used, 11))) used++;
                target = Math.floorMod(input.display() * used, 11);
            }
            default -> { return failure("Select one of the five Number Nimbleness minigames"); }
        }
        if (!input.availableDigits().contains(target)) {
            return failure("The required digit is not among the remaining buttons; recheck the live display and buttons");
        }
        NumberNimblenessOutput output = new NumberNimblenessOutput(
            target, used, used + 1, input.availableDigits().size() - 1, game.replace('_', ' ')
        );
        return success(output, input.stage() == 3 && input.availableDigits().size() == 1);
    }
}
