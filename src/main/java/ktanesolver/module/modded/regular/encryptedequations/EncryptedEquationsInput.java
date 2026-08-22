package ktanesolver.module.modded.regular.encryptedequations;

import ktanesolver.logic.ModuleInput;

public record EncryptedEquationsInput(
        Operand leftOperand,
        MainOperation leftOperation,
        Operand middleOperand,
        MainOperation rightOperation,
        Operand rightOperand,
        Parentheses parentheses) implements ModuleInput {
    public record Operand(
            Shape shape,
            CharacterSymbol character,
            SurroundSymbol surroundSymbol,
            Direction direction,
            CornerOperation cornerOperation) {}

    public enum Shape {
        TRIANGLE(0), SQUARE(1), HORIZONTAL_RECTANGLE(2), X(3), LEFT_RHOMBUS(4),
        OCTAGON(5), CIRCLE(6), TRAPEZOID(7), PENTAGON(8), HEXAGON(9), HASH(10),
        PLUS(15), OVAL(20), RIGHT_RHOMBUS(25), UPSIDE_DOWN_TRIANGLE(30), DIAMOND(35),
        VERTICAL_RECTANGLE(40), SIX_POINTED_STAR(45), FIVE_POINTED_STAR(50), BLANK(100);
        private final int value;
        Shape(int value) { this.value = value; }
        public int value() { return value; }
    }
    public enum CharacterSymbol { A, B, C, D, E, F, G, PI, S, N, HASH, H, O, QUESTION, K, PERCENT, R, EQUALS, SLASH, BACKSLASH }
    public enum SurroundSymbol { NONE, DOT, HORIZONTAL_LINE, VERTICAL_LINE, HOLLOW_DOT }
    public enum Direction { NORTH, EAST, SOUTH, WEST }
    public enum CornerOperation { NONE, INVERT, ABSOLUTE, SQUARE, CUBE }
    public enum MainOperation { ADD, SUBTRACT, MULTIPLY, DIVIDE }
    public enum Parentheses { LEFT_PAIR, RIGHT_PAIR }
}
