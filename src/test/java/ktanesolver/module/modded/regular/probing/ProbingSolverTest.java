package ktanesolver.module.modded.regular.probing;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class ProbingSolverTest {

    private final ProbingSolver solver = new ProbingSolver();

    @Test
    void catalogUsesProbingMetadata() {
        ModuleInfo moduleInfo = ProbingSolver.class.getAnnotation(ModuleInfo.class);

        assertThat(moduleInfo).isNotNull();
        assertThat(moduleInfo.name()).isEqualTo("Probing");
        assertThat(moduleInfo.type()).isEqualTo(ModuleType.PROBING);
    }

    @Test
    void solveUsesWireOneAndWireFiveRulesToPickTargetWires() {
        ProbingOutput output = solve(List.of(10, 50, 22, 60, 22, 50));

        assertThat(output.redTargetFrequency()).isEqualTo(50);
        assertThat(output.blueTargetFrequency()).isEqualTo(22);
        assertThat(output.redClipCandidates()).containsExactly(2, 6);
        assertThat(output.blueClipCandidates()).containsExactly(3, 5);
        assertThat(output.redClipWire()).isEqualTo(2);
        assertThat(output.blueClipWire()).isEqualTo(3);
        assertThat(output.instruction()).contains("red clip to wire 2");
        assertThat(output.instruction()).contains("blue clip to wire 3");
    }

    @Test
    void solveUsesWireFiveForRedAndFallsBackToMissingSixForBlue() {
        ProbingOutput output = solve(List.of(50, 60, 22, 60, 10, 22));

        assertThat(output.redTargetFrequency()).isEqualTo(10);
        assertThat(output.blueTargetFrequency()).isEqualTo(60);
        assertThat(output.redClipCandidates()).containsExactly(5);
        assertThat(output.blueClipCandidates()).containsExactly(2, 4);
        assertThat(output.redClipWire()).isEqualTo(5);
        assertThat(output.blueClipWire()).isEqualTo(2);
    }

    @Test
    void solveRejectsMissingFrequencyListsThatAreNotSixLong() {
        ModuleEntity module = module();
        SolveResult<ProbingOutput> result = solver.solve(
            new RoundEntity(),
            new BombEntity(),
            module,
            new ProbingInput(List.of(10, 22, 50))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<ProbingOutput>) result).getReason()).isEqualTo("Probing requires exactly 6 missing frequencies in reading order");
        assertThat(module.isSolved()).isFalse();
    }

    @Test
    void solveRejectsUnknownMissingFrequencies() {
        ModuleEntity module = module();
        SolveResult<ProbingOutput> result = solver.solve(
            new RoundEntity(),
            new BombEntity(),
            module,
            new ProbingInput(List.of(10, 22, 50, 60, 15, 22))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<ProbingOutput>) result).getReason()).isEqualTo("Probing missing frequencies must be one of 10, 22, 50, or 60");
        assertThat(module.isSolved()).isFalse();
    }

    @Test
    void solveRejectsImpossibleConfigurationsThatLackTheRequiredTargetWire() {
        ModuleEntity module = module();
        SolveResult<ProbingOutput> result = solver.solve(
            new RoundEntity(),
            new BombEntity(),
            module,
            new ProbingInput(List.of(10, 22, 22, 60, 22, 60))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<ProbingOutput>) result).getReason()).isEqualTo("No wire is missing 50Hz, so the red clip cannot be placed");
        assertThat(module.isSolved()).isFalse();
    }

    @Test
    void solveRejectsImpossibleConfigurationsWhenOnlyTheBlueTargetWireIsMissing() {
        ModuleEntity module = module();
        SolveResult<ProbingOutput> result = solver.solve(
            new RoundEntity(),
            new BombEntity(),
            module,
            new ProbingInput(List.of(10, 50, 22, 10, 10, 22))
        );

        assertThat(result).isInstanceOf(SolveFailure.class);
        assertThat(((SolveFailure<ProbingOutput>) result).getReason()).isEqualTo("No wire is missing 60Hz, so the blue clip cannot be placed");
        assertThat(module.isSolved()).isFalse();
    }

    private ProbingOutput solve(List<Integer> missingFrequenciesByWire) {
        ModuleEntity module = module();
        SolveResult<ProbingOutput> result = solver.solve(
            new RoundEntity(),
            new BombEntity(),
            module,
            new ProbingInput(missingFrequenciesByWire)
        );

        assertThat(result).isInstanceOf(SolveSuccess.class);
        assertThat(module.isSolved()).isTrue();

        ProbingOutput output = ((SolveSuccess<ProbingOutput>) result).output();
        assertThat(module.getSolution()).containsEntry("redClipWire", output.redClipWire());
        assertThat(module.getSolution()).containsEntry("blueClipWire", output.blueClipWire());
        return output;
    }

    private static ModuleEntity module() {
        ModuleEntity module = new ModuleEntity();
        module.setType(ModuleType.PROBING);
        module.setSolution(new java.util.HashMap<>());
        module.setState(new java.util.HashMap<>());
        return module;
    }
}
