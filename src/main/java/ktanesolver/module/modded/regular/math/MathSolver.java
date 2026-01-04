package ktanesolver.module.modded.regular.math;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;

@Service
public class MathSolver implements ModuleSolver<MathInput, MathOutput> {

    private static final Pattern EQUATION_PATTERN = Pattern.compile("^(-?\\d+)([+\\-*/])(-?\\d+)$");
    
    @Override
    public ModuleType getType() {
        return ModuleType.MATH;
    }

    @Override
    public Class<MathInput> inputType() {
        return MathInput.class;
    }

    @Override
    public SolveResult<MathOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, MathInput input) {
        String equation = input.equation();
        
        if (equation == null || equation.trim().isEmpty()) {
            return new SolveFailure<>("Equation cannot be empty");
        }
        
        equation = equation.trim().replaceAll("\\s+", "");
        
        Matcher matcher = EQUATION_PATTERN.matcher(equation);
        if (!matcher.matches()) {
            return new SolveFailure<>("Invalid equation format. Expected format: number [+,-,*,/] number (e.g., '52+123')");
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
                        return new SolveFailure<>("Division by zero is not allowed");
                    }
                    result = leftOperand / rightOperand;
                    break;
                default:
                    return new SolveFailure<>("Unsupported operator: " + operator);
            }
            
            MathOutput output = new MathOutput(result);
            module.setSolved(true);
            Json.mapper().convertValue(output, new TypeReference<Map<String, Object>>() {})
                .forEach(module.getSolution()::put);
            
            module.setState(input);
            return new SolveSuccess<>(output, true);
            
        } catch (NumberFormatException e) {
            return new SolveFailure<>("Invalid number format in equation");
        } catch (ArithmeticException e) {
            return new SolveFailure<>("Arithmetic error: " + e.getMessage());
        }
    }
}
