package ktanesolver.module.modded.regular.arithmelogic;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ArithmelogicInput(
    int symbolA, int symbolB, int symbolC, int submitSymbol,
    Operator leftOperator, Operator rightOperator, boolean leftGrouped,
    List<Integer> valuesA, List<Integer> valuesB, List<Integer> valuesC
) implements ModuleInput {
    public enum Operator { AND, OR, XOR, IMPLIES, NAND, NOR, XNOR, IMPLIED_BY }
}
