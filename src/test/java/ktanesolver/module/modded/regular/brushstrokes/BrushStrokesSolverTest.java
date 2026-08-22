package ktanesolver.module.modded.regular.brushstrokes;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.brushstrokes.BrushStrokesInput.KeyColor;

class BrushStrokesSolverTest {
    private final BrushStrokesSolver solver = new BrushStrokesSolver();
    @Test void calculatesTwoBitsAndReturnsTheExactEleventhSymbol() {
        BombEntity bomb = bomb(); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1);
        BrushStrokesOutput out = solve(bomb, new BrushStrokesInput(KeyColor.RED, null));
        assertThat(out.rawKeyNumber()).isEqualTo(10); assertThat(out.symbolNumber()).isEqualTo(11);
        assertThat(out.strokes()).containsExactly("12", "23", "78", "89", "15", "59", "35", "57");
        assertThat(out.twitchCommand()).isEqualTo("connect 1 2;2 3;7 8;8 9;1 5;5 9;3 5;5 7");
    }
    @Test void recalculatesModernCipherWithCurrentStrikes() {
        BombEntity bomb = bomb(); bomb.setStrikes(2);
        BrushStrokesOutput out = solve(bomb, new BrushStrokesInput(KeyColor.YELLOW, null));
        assertThat(out.rawKeyNumber()).isEqualTo(8); assertThat(out.symbolNumber()).isEqualTo(9);
    }
    @Test void appliesColorGeneratorHexLikeLetterValues() {
        BombEntity bomb = bomb(); bomb.setSerialNumber("PZ9A0F");
        assertThat(solve(bomb, new BrushStrokesInput(KeyColor.ORANGE, null)).rawKeyNumber()).isEqualTo(10);
    }
    @SuppressWarnings("unchecked") private BrushStrokesOutput solve(BombEntity bomb, BrushStrokesInput input) {
        return ((SolveSuccess<BrushStrokesOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
    }
    private static BombEntity bomb() {
        BombEntity b = new BombEntity(); b.setSerialNumber("A1B2C3"); b.setIndicators(new HashMap<>(Map.of("SND", true, "FRQ", false)));
        b.replacePortPlates(List.of(Set.of(PortType.DVI))); return b;
    }
}
