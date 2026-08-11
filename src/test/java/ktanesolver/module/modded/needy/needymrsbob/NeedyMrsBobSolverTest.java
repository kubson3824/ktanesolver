package ktanesolver.module.modded.needy.needymrsbob;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class NeedyMrsBobSolverTest {
    private final NeedyMrsBobSolver solver = new NeedyMrsBobSolver();
    private static final List<String> EXPECTED = List.of(
        "THUMBS_UP","COW_FACE","MONEY","THINKING_FACE","SHRUG","COW_FACE","SHRUG","THINKING_FACE","WEARY_FACE","POO","TEA","WEARY_FACE","THUMBS_UP","COW_FACE","MONEY","THINKING_FACE","COW_FACE","SHRUG","TEA","THUMBS_UP",
        "SHRUG","WEARY_FACE","THUMBS_UP","RED_ANGER_FACE","BOWING","BOWING","RED_ANGER_FACE","POO","SHRUG","WEARY_FACE","THUMBS_UP","MONEY","WEARY_FACE","POO","THUMBS_UP","POO","BOWING","THINKING_FACE","WEARY_FACE","SHRUG",
        "TAKEAWAY","WINE","PIZZA","THINKING_FACE","SHRUG","WINE","TAKEAWAY","SHRUG","PIZZA","THUMBS_UP","PIZZA","THUMBS_UP","TAKEAWAY","WEARY_FACE","WINE","WEARY_FACE","THINKING_FACE","WINE","TAKEAWAY","PIZZA",
        "SHRUG","CAR","BEER","GOLF","THINKING_FACE","GOLF","SHRUG","THINKING_FACE","CAR","BEER","BEER","GOLF","CAR","THUMBS_UP","SHRUG","BOWING","BEER","GOLF","SHRUG","CAR",
        "THUMBS_UP","RED_HEART","OK_HAND","KISS_FACE","BEAR","KISS_FACE","BEAR","RED_HEART","THUMBS_UP","OK_HAND","OK_HAND","THUMBS_UP","KISS_FACE","BEAR","RED_HEART","RED_HEART","KISS_FACE","BEAR","OK_HAND","THUMBS_UP",
        "POO","CRYING","OK_HAND","THUMBS_UP","RED_HEART","SHRUG","THINKING_FACE","MONEY","TOOL","KISS_FACE","CRYING","THUMBS_UP","RED_HEART","TOOL","SHRUG","OK_HAND","CRYING","TOOL","POO","THINKING_FACE"
    );

    @Test void matchesAll120ManualCellsAndFindsRandomizedPositions() {
        List<String> reversed = new ArrayList<>(NeedyMrsBobSolver.RESPONSE_NAMES); java.util.Collections.reverse(reversed);
        for (int message = 1; message <= 24; message++) for (int received = 1; received <= 5; received++) {
            NeedyMrsBobOutput output = solve(new NeedyMrsBobInput(message, received, reversed));
            String expected = EXPECTED.get((message - 1) * 5 + received - 1);
            assertThat(output.response()).isEqualTo(expected);
            assertThat(output.responsePosition()).isEqualTo(reversed.indexOf(expected) + 1);
        }
    }

    @Test void validatesMessageEmojiAndCompletePermutation() {
        assertThat(result(new NeedyMrsBobInput(0,1,NeedyMrsBobSolver.RESPONSE_NAMES))).isInstanceOf(SolveFailure.class);
        assertThat(result(new NeedyMrsBobInput(1,6,NeedyMrsBobSolver.RESPONSE_NAMES))).isInstanceOf(SolveFailure.class);
        assertThat(result(new NeedyMrsBobInput(1,1,NeedyMrsBobSolver.RESPONSE_NAMES.subList(0,23)))).isInstanceOf(SolveFailure.class);
    }

    private NeedyMrsBobOutput solve(NeedyMrsBobInput input) { return ((SolveSuccess<NeedyMrsBobOutput>) result(input)).output(); }
    private Object result(NeedyMrsBobInput input) { return solver.solve(new RoundEntity(),new BombEntity(),new ModuleEntity(),input); }
}
