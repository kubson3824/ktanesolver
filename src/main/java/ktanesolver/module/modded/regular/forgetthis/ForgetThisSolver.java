package ktanesolver.module.modded.regular.forgetthis;

import java.util.ArrayList;
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
import ktanesolver.module.modded.regular.forgetthis.ForgetThisInput.LedColor;
import ktanesolver.module.modded.regular.forgetthis.ForgetThisInput.Stage;
import ktanesolver.module.modded.regular.forgetthis.ForgetThisOutput.Step;

@Service
@ModuleInfo(
    type = ModuleType.FORGET_THIS,
    id = "forgetThis",
    name = "Forget This",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Apply the five final stage references to the recorded base-36 digit and LED history.",
    tags = {"boss", "memory", "base 36", "colors"}
)
public class ForgetThisSolver extends AbstractModuleSolver<ForgetThisInput, ForgetThisOutput> {
    @Override
    protected SolveResult<ForgetThisOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, ForgetThisInput input
    ) {
        if (input == null || input.stages() == null || input.stages().size() < 2) return failure("Record at least two stages");
        List<Integer> digits = new ArrayList<>(input.stages().size());
        List<String> colors = new ArrayList<>(input.stages().size());
        for (Stage stage : input.stages()) {
            if (stage == null || stage.color() == null) return failure("Every stage needs an LED color");
            int digit = digit(stage.digit());
            if (digit < 0) return failure("Every stage digit must be one character from 0-9 or A-Z");
            digits.add(digit);
            colors.add(display(stage.color()));
        }
        if (input.implementationStages() == null || input.implementationStages().size() != 5
            || input.implementationStages().stream().anyMatch(stage -> stage == null || stage < 2 || stage > input.stages().size())) {
            return failure("Enter five stage numbers between 2 and the final stage");
        }
        if (input.stages().size() > 5 && input.implementationStages().stream().distinct().count() != 5) {
            return failure("The five implementation stages must be distinct on bombs with more than five stages");
        }

        int current = digits.getFirst();
        List<Step> steps = new ArrayList<>(5);
        for (int stageNumber : input.implementationStages()) {
            Stage stage = input.stages().get(stageNumber - 1);
            LedColor previousColor = input.stages().get(stageNumber - 2).color();
            int before = current;
            String operation;
            if (blocked(stage.color(), previousColor)) {
                operation = "No change (blocked by previous " + display(previousColor) + ")";
            } else {
                int value = digits.get(stageNumber - 1);
                switch (stage.color()) {
                    case CYAN -> { current += value; operation = "Add " + value; }
                    case MAGENTA -> { current += value / 2; operation = "Add floor(" + value + " / 2)"; }
                    case YELLOW -> { current += value * 2; operation = "Add 2 × " + value; }
                    case BLACK -> { current = (current + value + 1) / 2; operation = "Average with " + value + " (round up)"; }
                    case WHITE -> { current -= value; operation = "Subtract " + value; }
                    default -> throw new IllegalStateException();
                }
                current = Math.floorMod(current, 36);
            }
            steps.add(new Step(stageNumber, before, operation, current));
        }

        String answer = String.valueOf(Character.toUpperCase(Character.forDigit(current, 36)));
        storeState(module, "forgetThisDigits", input.stages().stream().map(stage -> stage.digit().trim().toUpperCase(Locale.ROOT)).toList());
        storeState(module, "forgetThisColors", List.copyOf(colors));
        return success(new ForgetThisOutput(answer, current, List.copyOf(steps)));
    }

    private static int digit(String value) {
        if (value == null || value.trim().length() != 1) return -1;
        return Character.digit(value.trim().charAt(0), 36);
    }

    private static boolean blocked(LedColor color, LedColor previous) {
        return switch (color) {
            case CYAN -> previous == LedColor.YELLOW;
            case MAGENTA -> previous == LedColor.BLACK;
            case YELLOW -> previous == LedColor.WHITE;
            case BLACK -> previous == LedColor.CYAN;
            case WHITE -> previous == LedColor.MAGENTA;
        };
    }

    private static String display(LedColor color) {
        String name = color.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(name.charAt(0)) + name.substring(1);
    }
}
