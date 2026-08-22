package ktanesolver.module.modded.regular.simonstores;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.simonstores.SimonStoresInput.Color;

class SimonStoresSolverTest {
    private static final List<Color> BUTTONS = List.of(Color.R, Color.G, Color.B, Color.C, Color.M, Color.Y);

    @Test
    void solvesAllThreeGrowingStagesAndPersistsTheFinalSouvenirSequence() {
        BombEntity bomb = bomb("AB1C23");
        ModuleEntity module = new ModuleEntity();
        SimonStoresSolver solver = new SimonStoresSolver();

        var stage1 = solve(solver, bomb, module, 1, List.of("R", "G", "B"));
        assertThat(stage1.output().stageValues()).containsExactly(48, 87, 48, 57);
        assertThat(stage1.output().balancedTernary()).isEqualTo("0+-0+0");
        assertThat(stage1.output().executionOrder()).isEqualTo("CMRYBG");
        assertThat(stage1.output().twitchCommand()).isEqualTo("AMKYWBA");
        assertThat(stage1.solved()).isFalse();

        var stage2 = solve(solver, bomb, module, 2, List.of("R", "G", "B", "C"));
        assertThat(stage2.output().stageValues()).containsExactly(75, 124, 161, 238, 325);
        assertThat(stage2.output().twitchCommand()).isEqualTo("AGYCA");
        assertThat(stage2.solved()).isFalse();

        var stage3 = solve(solver, bomb, module, 3, List.of("R", "G", "B", "C", "M"));
        assertThat(stage3.output().stageValues()).containsExactly(6, 33, -215, -197, -13, -13);
        assertThat(stage3.output().balancedTernary()).isEqualTo("000---");
        assertThat(stage3.output().twitchCommand()).isEqualTo("AKRBCA");
        assertThat(stage3.solved()).isTrue();
        assertThat(module.getState().get("simonStoresFlashes")).isEqualTo(List.of("R", "G", "B", "C", "M"));
    }

    @Test
    void evaluatesPrimarySecondaryAndThreeColorFlashFamilies() {
        var result = solve(new SimonStoresSolver(), bomb("AB1C23"), new ModuleEntity(), 1, List.of("RG", "CM", "RGB"));
        assertThat(result.output().stageValues()).containsExactly(48, 87, -150, -102);
        assertThat(result.output().balancedTernary()).isEqualTo("0--+-0");
        assertThat(result.output().twitchCommand()).isEqualTo("AKMWRKYBA");
    }

    private static SolveSuccess<SimonStoresOutput> solve(
            SimonStoresSolver solver, BombEntity bomb, ModuleEntity module, int stage, List<String> flashes) {
        return (SolveSuccess<SimonStoresOutput>) solver.solve(
                new RoundEntity(), bomb, module, new SimonStoresInput(stage, BUTTONS, flashes));
    }

    private static BombEntity bomb(String serial) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serial);
        return bomb;
    }
}
