package ktanesolver.module.vanilla.regular.button;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import org.springframework.stereotype.Service;

@Service
public class ButtonSolver implements ModuleSolver<ButtonInput, ButtonOutput> {

    @Override
    public ModuleType getType() {
        return ModuleType.BUTTON;
    }

    @Override
    public Class<ButtonInput> inputType() {
        return ButtonInput.class;
    }

    @Override
    public SolveResult<ButtonOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, ButtonInput input) {
        String color = input.color();
        String label = input.label();


        if (input.stripColor() != null) {
            if (input.stripColor().equalsIgnoreCase("BLUE")){
                return new SolveSuccess<>(new ButtonOutput(false, "Release when timer has 4", 4), true);
            }
            if (input.stripColor().equalsIgnoreCase("WHITE")){
                return new SolveSuccess<>(new ButtonOutput(false, "Release when timer has 1", 1), true);
            }
            if (input.stripColor().equalsIgnoreCase("YELLOW")){
                return new SolveSuccess<>(new ButtonOutput(false, "Release when timer has 5", 5), true);
            }
            return new SolveSuccess<>(new ButtonOutput(false, "Release when timer has 1", 1), true);
        }

        // Immediate release rules
        if (color.equalsIgnoreCase("BLUE") && label.equalsIgnoreCase("ABORT")) {
            return hold();
        }

        if (label.equalsIgnoreCase("DETONATE") && bomb.getBatteryCount() > 1) {
            return solved("Press and immediately release");
        }

        if (color.equalsIgnoreCase("WHITE") && hasLitIndicator(bomb, "CAR")) {
            return hold();
        }

        if (bomb.getBatteryCount() > 2 && hasLitIndicator(bomb, "FRK")) {
            return solved("Press and immediately release");
        }

        if (color.equalsIgnoreCase("YELLOW")) {
            return hold();
        }

        if (color.equalsIgnoreCase("RED") && label.equalsIgnoreCase("HOLD")) {
            return solved("Press and immediately release");
        }

        return hold();
    }

    private SolveResult<ButtonOutput> hold() {
        return solved(new ButtonOutput(true, "Hold the button", null));
    }

    private SolveResult<ButtonOutput> solved(String instruction) {
        return solved(new ButtonOutput(false, instruction, null));
    }

    private SolveResult<ButtonOutput> solved(ButtonOutput output) {
        return new SolveSuccess<>(output, true);
    }

    private boolean hasLitIndicator(BombEntity bomb, String indicator) {
        Boolean bombIndicator = bomb.getIndicators().getOrDefault(indicator, null);
        return bombIndicator != null && bombIndicator;
    }
}
