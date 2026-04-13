package ktanesolver.module.modded.regular.numberpad;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class NumberPadSolverTest {

    private final NumberPadSolver solver = new NumberPadSolver();

    @Test
    void catalogNameUsesNumberPadSpellingForTimwiManualLookup() {
        ModuleInfo moduleInfo = NumberPadSolver.class.getAnnotation(ModuleInfo.class);

        assertThat(moduleInfo).isNotNull();
        assertThat(moduleInfo.name()).isEqualTo("Number Pad");
    }

    @Test
    void solveUsesDefaultFallbackBranches() {
        NumberPadOutput output = solveCode(
            colors(
                NumberPadColor.RED,
                NumberPadColor.BLUE,
                NumberPadColor.WHITE,
                NumberPadColor.RED,
                NumberPadColor.YELLOW,
                NumberPadColor.WHITE,
                NumberPadColor.YELLOW,
                NumberPadColor.BLUE,
                NumberPadColor.RED,
                NumberPadColor.WHITE
            ),
            bomb("BCDF13", 2, 2)
        );

        assertThat(output.code()).isEqualTo("4294");
        assertThat(output.instruction()).contains("4294");
    }

    @Test
    void solveAppliesLevelTwoTopRowGreenDecrementCase() {
        NumberPadOutput output = solveCode(
            colors(
                NumberPadColor.RED,
                NumberPadColor.BLUE,
                NumberPadColor.WHITE,
                NumberPadColor.RED,
                NumberPadColor.YELLOW,
                NumberPadColor.WHITE,
                NumberPadColor.YELLOW,
                NumberPadColor.GREEN,
                NumberPadColor.RED,
                NumberPadColor.WHITE
            ),
            bomb("BCDF13", 2, 2)
        );

        assertThat(output.code()).isEqualTo("4824");
    }

    @Test
    void solveAppliesLevelThreeReverseBranch() {
        NumberPadOutput output = solveCode(
            colors(
                NumberPadColor.YELLOW,
                NumberPadColor.RED,
                NumberPadColor.GREEN,
                NumberPadColor.YELLOW,
                NumberPadColor.RED,
                NumberPadColor.WHITE,
                NumberPadColor.RED,
                NumberPadColor.BLUE,
                NumberPadColor.BLUE,
                NumberPadColor.YELLOW
            ),
            bomb("BCDF13", 1, 1)
        );

        assertThat(output.code()).isEqualTo("9299");
    }

    @Test
    void solveUsesSerialVowelTopRowLookupBranch() {
        NumberPadOutput output = solveCode(
            colors(
                NumberPadColor.RED,
                NumberPadColor.YELLOW,
                NumberPadColor.WHITE,
                NumberPadColor.RED,
                NumberPadColor.GREEN,
                NumberPadColor.WHITE,
                NumberPadColor.BLUE,
                NumberPadColor.BLUE,
                NumberPadColor.RED,
                NumberPadColor.WHITE
            ),
            bomb("ACDF13", 2, 2)
        );

        assertThat(output.code()).isEqualTo("0811");
    }

    @Test
    void solveAppliesFinalTransformationsFromBombEdgework() {
        List<NumberPadColor> buttonColors = colors(
            NumberPadColor.YELLOW,
            NumberPadColor.WHITE,
            NumberPadColor.RED,
            NumberPadColor.YELLOW,
            NumberPadColor.RED,
            NumberPadColor.RED,
            NumberPadColor.BLUE,
            NumberPadColor.WHITE,
            NumberPadColor.WHITE,
            NumberPadColor.YELLOW
        );

        assertThat(solveCode(buttonColors, bomb("BCDF12", 2, 1)).code()).isEqualTo("9321");
        assertThat(solveCode(buttonColors, bomb("BCDF13", 1, 1)).code()).isEqualTo("2931");
        assertThat(solveCode(buttonColors, bomb("BCDF12", 1, 1)).code()).isEqualTo("9231");
        assertThat(solveCode(buttonColors, bomb("BCDF13", 2, 1)).code()).isEqualTo("1392");
    }

    @Test
    void solveRejectsMissingButtonColors() {
        ModuleEntity module = module();
        SolveResult<NumberPadOutput> result = solver.solve(
            new RoundEntity(),
            bomb("BCDF13", 1, 1),
            module,
            new NumberPadInput(List.of(NumberPadColor.RED, NumberPadColor.BLUE))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<NumberPadOutput>) result).getReason()).isEqualTo("Number Pad requires exactly 10 button colors");
        assertThat(module.isSolved()).isFalse();
    }

    private NumberPadOutput solveCode(List<NumberPadColor> buttonColors, BombEntity bomb) {
        ModuleEntity module = module();
        SolveResult<NumberPadOutput> result = solver.solve(new RoundEntity(), bomb, module, new NumberPadInput(buttonColors));

        assertThat(result).isInstanceOf(SolveSuccess.class);
        assertThat(module.isSolved()).isTrue();

        NumberPadOutput output = ((SolveSuccess<NumberPadOutput>) result).output();
        assertThat(module.getSolution()).containsEntry("code", output.code());
        return output;
    }

    private static ModuleEntity module() {
        ModuleEntity module = new ModuleEntity();
        module.setSolution(new java.util.HashMap<>());
        module.setState(new java.util.HashMap<>());
        return module;
    }

    private static BombEntity bomb(String serialNumber, int aaBatteryCount, int portCount) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serialNumber);
        bomb.setAaBatteryCount(aaBatteryCount);
        bomb.setDBatteryCount(0);

        for (int i = 0; i < portCount; i++) {
            PortPlateEntity plate = new PortPlateEntity();
            plate.setBomb(bomb);
            plate.setPorts(Set.of(i % 2 == 0 ? PortType.DVI : PortType.PARALLEL));
            bomb.getPortPlates().add(plate);
        }

        return bomb;
    }

    private static List<NumberPadColor> colors(NumberPadColor... buttonColors) {
        return List.of(buttonColors);
    }
}
