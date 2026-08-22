package ktanesolver.module.modded.regular.burgeralarm;

import static org.assertj.core.api.Assertions.assertThat;
import static ktanesolver.module.modded.regular.burgeralarm.BurgerAlarmInput.Ingredient.*;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BurgerAlarmSolverTest {
    private final BurgerAlarmSolver solver = new BurgerAlarmSolver();
    private static final List<BurgerAlarmInput.Ingredient> LAYOUT = List.of(MAYO,BUN,TOMATO,CHEESE,LETTUCE,ONIONS,PICKLES,MUSTARD,KETCHUP,MEAT);

    @Test void derivesAllOffsetsSwapsAndBurgerIngredients() {
        ModuleEntity module = new ModuleEntity();
        BurgerAlarmOutput output = solve(module, new BurgerAlarmInput(LAYOUT, "0001036", List.of("00","12","34","56","78"), false, false));
        assertThat(output.tableNumbers()).containsExactly(4,2,9,4,6,4,5,8);
        assertThat(output.swapIndexes()).containsExactly(4,2,9,5,6,7,1,8);
        assertThat(output.pressSequence()).containsExactly(BUN,MAYO,MAYO,CHEESE,MAYO,BUN,BUN);
        assertThat(module.getState().get("burgerAlarmOrders")).isEqualTo(List.of("00","12","34","56","78"));
    }

    @Test void rejectsDuplicateIngredientsAndImpossibleSwapIndexes() {
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new BurgerAlarmInput(
            List.of(MAYO,MAYO,TOMATO,CHEESE,LETTUCE,ONIONS,PICKLES,MUSTARD,KETCHUP,MEAT), "0001036", List.of("00","12","34","56","78"), false, false))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new BurgerAlarmInput(
            LAYOUT, "0000000", List.of("00","12","34","56","78"), false, false))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private BurgerAlarmOutput solve(ModuleEntity module, BurgerAlarmInput input) {
        return ((SolveSuccess<BurgerAlarmOutput>) solver.solve(new RoundEntity(), bomb(), module, input)).output();
    }
    private static BombEntity bomb() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); bomb.setDBatteryCount(0);
        bomb.setModules(List.of()); bomb.setIndicators(Map.of()); return bomb;
    }
}
