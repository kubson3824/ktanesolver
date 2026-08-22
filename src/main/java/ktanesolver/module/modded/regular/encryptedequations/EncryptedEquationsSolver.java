package ktanesolver.module.modded.regular.encryptedequations;

import static ktanesolver.module.modded.regular.encryptedequations.EncryptedEquationsInput.*;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
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
        type = ModuleType.ENCRYPTED_EQUATIONS,
        id = "EncryptedEquationsModule",
        name = "Encrypted Equations",
        category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
        description = "Decode the three encrypted operands and evaluate the parenthesized equation.",
        tags = {"equations", "symbols", "arithmetic"})
public class EncryptedEquationsSolver extends AbstractModuleSolver<EncryptedEquationsInput, EncryptedEquationsOutput> {
    private static final MathContext MC = MathContext.DECIMAL128;
    private static final BigDecimal ONE_POINT_FIVE = new BigDecimal("1.5");

    @Override
    protected SolveResult<EncryptedEquationsOutput> doSolve(
            RoundEntity round, BombEntity bomb, ModuleEntity module, EncryptedEquationsInput input) {
        if (input == null || invalid(input.leftOperand()) || invalid(input.middleOperand()) || invalid(input.rightOperand())
                || input.leftOperation() == null || input.rightOperation() == null || input.parentheses() == null) {
            return failure("Enter all three operands, both operations, and the parentheses side");
        }

        BigDecimal left = operand(input.leftOperand());
        BigDecimal middle = operand(input.middleOperand());
        BigDecimal right = operand(input.rightOperand());
        List<String> operandValues = List.of(format(left), format(middle), format(right));
        boolean undefined = false;
        BigDecimal answer = BigDecimal.ZERO;
        try {
            if (input.parentheses() == Parentheses.RIGHT_PAIR) {
                BigDecimal pair = round(evaluate(input.rightOperation(), middle, right));
                answer = round(evaluate(input.leftOperation(), left, pair));
            } else {
                BigDecimal pair = round(evaluate(input.leftOperation(), left, middle));
                answer = round(evaluate(input.rightOperation(), pair, right));
            }
        } catch (ArithmeticException e) {
            undefined = true;
        }

        String answerText = undefined ? "UNDEFINED" : format(answer);
        String command = undefined ? "submit" : "submit " + answerText;
        storeState(module, "encryptedEquationsShapes", List.of(
                shapeIndex(input.leftOperand().shape()), shapeIndex(input.middleOperand().shape()), shapeIndex(input.rightOperand().shape())));
        return success(new EncryptedEquationsOutput(operandValues, undefined, answerText, command));
    }

    private static boolean invalid(Operand operand) {
        return operand == null || operand.shape() == null || operand.character() == null
                || operand.surroundSymbol() == null || operand.cornerOperation() == null
                || (operand.surroundSymbol() != SurroundSymbol.NONE && operand.direction() == null);
    }

    private static BigDecimal operand(Operand operand) {
        BigDecimal value = applyCharacter(operand.character(), BigDecimal.valueOf(operand.shape().value()));
        value = round(value);
        if (operand.surroundSymbol() != SurroundSymbol.NONE) value = round(applySurround(operand.surroundSymbol(), operand.direction(), value));
        value = switch (operand.cornerOperation()) {
            case NONE -> value;
            case INVERT -> value.negate();
            case ABSOLUTE -> value.abs();
            case SQUARE -> BigDecimal.valueOf(Math.pow(value.doubleValue(), 2));
            case CUBE -> BigDecimal.valueOf(Math.pow(value.doubleValue(), 3));
        };
        return round(value);
    }

    private static BigDecimal applyCharacter(CharacterSymbol character, BigDecimal value) {
        return switch (character) {
            case A -> value.add(BigDecimal.ONE);
            case B -> value.add(BigDecimal.valueOf(3));
            case C -> value.subtract(BigDecimal.valueOf(2));
            case D -> value.subtract(BigDecimal.valueOf(4));
            case E -> value.multiply(BigDecimal.valueOf(2));
            case F -> value.divide(BigDecimal.valueOf(2), MC);
            case G -> value.add(BigDecimal.valueOf(2));
            case PI -> value.multiply(ONE_POINT_FIVE);
            case S -> value.divide(ONE_POINT_FIVE, MC);
            case N -> value.subtract(BigDecimal.valueOf(6));
            case HASH -> value.add(BigDecimal.valueOf(5));
            case H -> value.multiply(BigDecimal.valueOf(3));
            case O -> value.subtract(BigDecimal.ONE);
            case QUESTION -> value.multiply(BigDecimal.TEN);
            case K -> value.divide(BigDecimal.valueOf(5), MC);
            case PERCENT -> value.add(BigDecimal.TEN);
            case R -> value.subtract(BigDecimal.valueOf(5));
            case EQUALS -> value.add(BigDecimal.valueOf(4));
            case SLASH -> value.multiply(BigDecimal.valueOf(4));
            case BACKSLASH -> value.divide(BigDecimal.TEN, MC);
        };
    }

    private static BigDecimal applySurround(SurroundSymbol symbol, Direction direction, BigDecimal value) {
        return switch (symbol) {
            case NONE -> value;
            case DOT -> switch (direction) {
                case NORTH -> value.add(BigDecimal.ONE); case EAST -> value.subtract(BigDecimal.valueOf(2));
                case SOUTH -> value.multiply(BigDecimal.valueOf(3)); case WEST -> value.add(BigDecimal.valueOf(3));
            };
            case HORIZONTAL_LINE -> switch (direction) {
                case NORTH -> value.multiply(ONE_POINT_FIVE); case EAST -> value.divide(BigDecimal.valueOf(5), MC);
                case SOUTH -> value.subtract(BigDecimal.ONE); case WEST -> value.divide(ONE_POINT_FIVE, MC);
            };
            case VERTICAL_LINE -> switch (direction) {
                case NORTH -> value.subtract(BigDecimal.valueOf(4)); case EAST -> value.add(BigDecimal.valueOf(2));
                case SOUTH -> value.multiply(BigDecimal.valueOf(2)); case WEST -> value.multiply(BigDecimal.valueOf(5));
            };
            case HOLLOW_DOT -> switch (direction) {
                case NORTH -> value.add(BigDecimal.valueOf(4)); case EAST -> value.divide(BigDecimal.TEN, MC);
                case SOUTH -> value.divide(BigDecimal.valueOf(2), MC); case WEST -> value.subtract(BigDecimal.valueOf(3));
            };
        };
    }

    private static BigDecimal evaluate(MainOperation operation, BigDecimal left, BigDecimal right) {
        return switch (operation) {
            case ADD -> left.add(right);
            case SUBTRACT -> left.subtract(right);
            case MULTIPLY -> left.multiply(right);
            case DIVIDE -> left.divide(right, MC);
        };
    }

    private static BigDecimal round(BigDecimal value) {
        return value.setScale(3, RoundingMode.HALF_UP);
    }

    private static String format(BigDecimal value) {
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.signum() == 0 ? "0" : stripped.toPlainString();
    }

    private static int shapeIndex(Shape shape) {
        return shape == Shape.BLANK ? -1 : shape.ordinal();
    }
}
