package ktanesolver.module.modded.regular.math;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
        type = ModuleType.MATH,
        id = "math",
        name = "Math",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Solve math problems",
        tags = {"puzzle", "visual"}
)
public class MathSolver extends AbstractModuleSolver<MathInput, MathOutput> {

    private static final Pattern EQUATION_PATTERN = Pattern.compile("^(-?\\d+)([+\\-*/])(-?\\d+)$");

    @Override
    public SolveResult<MathOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MathInput input) {
        String equation = input.equation();
        
        if (equation == null || equation.trim().isEmpty()) {
            return failure("Equation cannot be empty");
        }
        
        equation = equation.trim().replaceAll("\\s+", "");
        
        Matcher matcher = EQUATION_PATTERN.matcher(equation);
        if (!matcher.matches()) {
            return failure("Invalid equation format. Expected format: number [+,-,*,/] number (e.g., '52+123')");
        }
        
        try {
            long leftOperand = Long.parseLong(matcher.group(1));
            String operator = matcher.group(2);
            long rightOperand = Long.parseLong(matcher.group(3));
            
            long result;
            switch (operator) {
                case "+":
                    result = leftOperand + rightOperand;
                    break;
                case "-":
                    result = leftOperand - rightOperand;
                    break;
                case "*":
                    result = leftOperand * rightOperand;
                    break;
                case "/":
                    if (rightOperand == 0) {
                        return failure("Division by zero is not allowed");
                    }
                    result = leftOperand / rightOperand;
                    break;
                default:
                    return failure("Unsupported operator: " + operator);
            }
            
            MathOutput output = new MathOutput(result);
            storeState(module, "input", input);
            return success(output);
            
        } catch (NumberFormatException e) {
            return failure("Invalid number format in equation");
        } catch (ArithmeticException e) {
            return failure("Arithmetic error: " + e.getMessage());
        }
    }
}
