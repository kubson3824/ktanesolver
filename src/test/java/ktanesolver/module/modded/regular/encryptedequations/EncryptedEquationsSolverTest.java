package ktanesolver.module.modded.regular.encryptedequations;

import static org.assertj.core.api.Assertions.assertThat;
import static ktanesolver.module.modded.regular.encryptedequations.EncryptedEquationsInput.*;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class EncryptedEquationsSolverTest {
    @Test
    void roundsEachLayerAndEvaluatesTheSelectedParenthesizedPair() {
        ModuleEntity module = new ModuleEntity();
        var input = new EncryptedEquationsInput(
                operand(Shape.SQUARE, CharacterSymbol.S), MainOperation.ADD,
                new Operand(Shape.SQUARE, CharacterSymbol.A, SurroundSymbol.HORIZONTAL_LINE, Direction.WEST, CornerOperation.SQUARE), MainOperation.MULTIPLY,
                operand(Shape.TRIANGLE, CharacterSymbol.A), Parentheses.LEFT_PAIR);

        var result = (SolveSuccess<EncryptedEquationsOutput>) new EncryptedEquationsSolver().solve(
                new RoundEntity(), new BombEntity(), module, input);

        assertThat(result.output().operandValues()).containsExactly("0.667", "1.777", "1");
        assertThat(result.output().answer()).isEqualTo("2.444");
        assertThat(result.output().twitchCommand()).isEqualTo("submit 2.444");
        assertThat(module.getState()).containsKey("encryptedEquationsShapes");
    }

    @Test
    void submitsBlankWhenTheParenthesizedPairDividesByZero() {
        var input = new EncryptedEquationsInput(
                operand(Shape.SQUARE, CharacterSymbol.A), MainOperation.ADD,
                operand(Shape.SQUARE, CharacterSymbol.A), MainOperation.DIVIDE,
                operand(Shape.TRIANGLE, CharacterSymbol.QUESTION), Parentheses.RIGHT_PAIR);

        var result = (SolveSuccess<EncryptedEquationsOutput>) new EncryptedEquationsSolver().solve(
                new RoundEntity(), new BombEntity(), new ModuleEntity(), input);

        assertThat(result.output().undefined()).isTrue();
        assertThat(result.output().answer()).isEqualTo("UNDEFINED");
        assertThat(result.output().twitchCommand()).isEqualTo("submit");
    }

    private static Operand operand(Shape shape, CharacterSymbol character) {
        return new Operand(shape, character, SurroundSymbol.NONE, Direction.NORTH, CornerOperation.NONE);
    }
}
