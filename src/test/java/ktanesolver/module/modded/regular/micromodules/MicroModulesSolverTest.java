package ktanesolver.module.modded.regular.micromodules;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.micromodules.MicroModulesInput.MicroIndicator;

class MicroModulesSolverTest {
    private final MicroModulesSolver solver = new MicroModulesSolver();

    @Test void solvesAllFourMicroModulesAndBuildsTheSourceAcceptedCommandOrder() {
        BombEntity bomb = bomb();
        ModuleEntity morse = new ModuleEntity(); morse.setType(ModuleType.MORSE_CODE); bomb.setModules(List.of(morse));
        MicroModulesOutput output = solve(bomb, input());
        assertThat(output.solveOrder()).containsExactly("CODE_MORSE", "DIRECTIONAL_KEYPADS", "THE_MATH_CODE", "SCRIPT_WIRES");
        assertThat(output.cutWires()).containsExactly(1);
        assertThat(output.keypadPosition()).isEqualTo(1);
        assertThat(output.morseCode()).isEqualTo("9640");
        assertThat(output.mathCode()).isEqualTo("142");
        assertThat(output.twitchCommands()).containsExactly("send 9 6 4 0", "press 1", "answer 1 4 2", "cut 1", "submit");
    }

    @Test void coversWireFallbackKeypadMovementAndAnyOrderRule() {
        assertThat(MicroModulesSolver.cutWires("CURRENTWIRE", List.of("RED", "RED", "BLUE", "RED", "RED", "RED"))).containsExactly(6);
        MicroModulesInput base = input();
        MicroModulesInput movement = new MicroModulesInput(1, 2, 3, 4, "BCDFG7",
            List.of(new MicroIndicator("BOOM", false), new MicroIndicator("MINI", false), new MicroIndicator("BOMB", true)),
            "BLUE", List.of("RIGHT", "REVERSE", "CLOCKWISE", "SWAP"), base.rendererName(), base.wireColors(), base.receivedMorseDigits(), base.mathLetters(), base.firstOperator(), base.secondOperator());
        MicroModulesOutput output = solve(bomb(), movement);
        assertThat(output.anyOrder()).isTrue();
        assertThat(output.keypadPosition()).isBetween(1, 4);
    }

    @Test void respectsIntegerDivisionPrecedenceAndRejectsDuplicateIds() {
        assertThat(MicroModulesSolver.mathCode("BCD", "+", "/", "BLACK", 0, 0)).isEqualTo("102");
        MicroModulesInput bad = new MicroModulesInput(1, 1, 3, 4, "ABCDE7", input().microIndicators(), "RED", input().arrows(), "BOMB", input().wireColors(), "1234", "ABC", "+", "*");
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), bad)).isInstanceOf(SolveFailure.class);
    }

    private BombEntity bomb() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1); bomb.setIndicators(Map.of("BOB", true, "FRK", false)); return bomb;
    }

    private MicroModulesInput input() {
        return new MicroModulesInput(2, 1, 4, 3, "ABCDE7",
            List.of(new MicroIndicator("INDC", true), new MicroIndicator("MINI", true), new MicroIndicator("EXPL", true)),
            "RED", List.of("RIGHT", "REVERSE", "CLOCKWISE", "SWAP"), "BOMB",
            List.of("RED", "BLACK", "BLACK", "BLACK", "BLACK", "RED"), "1234", "ABC", "+", "*");
    }

    @SuppressWarnings("unchecked")
    private MicroModulesOutput solve(BombEntity bomb, MicroModulesInput input) {
        return ((SolveSuccess<MicroModulesOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
    }
}
