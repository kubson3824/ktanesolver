package ktanesolver.module.vanilla.regular.button;

import com.fasterxml.jackson.core.type.TypeReference;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;
import org.springframework.stereotype.Service;

import java.util.Map;

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
        
        // Set module state with inputs
        module.getState().put("color", color);
        module.getState().put("label", label);
        if (input.stripColor() != null) {
            module.getState().put("stripColor", input.stripColor());
        }

        if (input.stripColor() != null) {
            if (input.stripColor().equalsIgnoreCase("BLUE")){
                ButtonOutput output = new ButtonOutput(false, "Release when timer has 4", 4);
                setModuleSolution(module, output);
                return new SolveSuccess<>(output, true);
            }
            if (input.stripColor().equalsIgnoreCase("WHITE")){
                ButtonOutput output = new ButtonOutput(false, "Release when timer has 1", 1);
                setModuleSolution(module, output);
                return new SolveSuccess<>(output, true);
            }
            if (input.stripColor().equalsIgnoreCase("YELLOW")){
                ButtonOutput output = new ButtonOutput(false, "Release when timer has 5", 5);
                setModuleSolution(module, output);
                return new SolveSuccess<>(output, true);
            }
            ButtonOutput output = new ButtonOutput(false, "Release when timer has 1", 1);
            setModuleSolution(module, output);
            return new SolveSuccess<>(output, true);
        }

        // Immediate release rules
        if (color.equalsIgnoreCase("BLUE") && label.equalsIgnoreCase("ABORT")) {
            return hold(module);
        }

        if (label.equalsIgnoreCase("DETONATE") && bomb.getBatteryCount() > 1) {
            return solved(module, "Press and immediately release");
        }

        if (color.equalsIgnoreCase("WHITE") && bomb.isIndicatorLit("CAR")) {
            return hold(module);
        }

        if (bomb.getBatteryCount() > 2 && bomb.isIndicatorLit("FRK")) {
            return solved(module, "Press and immediately release");
        }

        if (color.equalsIgnoreCase("YELLOW")) {
            return hold(module);
        }

        if (color.equalsIgnoreCase("RED") && label.equalsIgnoreCase("HOLD")) {
            return solved(module, "Press and immediately release");
        }

        return hold(module);
    }

    private void setModuleSolution(ModuleEntity module, ButtonOutput output) {
        module.setSolved(true);
        Map<String, Object> convertedValue = Json.mapper().convertValue(output, new TypeReference<>() {
        });
        convertedValue.forEach(module.getSolution()::put);
    }

    private SolveResult<ButtonOutput> hold(ModuleEntity module) {
        ButtonOutput output = new ButtonOutput(true, "Hold the button", null);
        setModuleSolution(module, output);
        return new SolveSuccess<>(output, true);
    }

    private SolveResult<ButtonOutput> solved(ModuleEntity module, String instruction) {
        ButtonOutput output = new ButtonOutput(false, instruction, null);
        setModuleSolution(module, output);
        return new SolveSuccess<>(output, true);
    }
}
