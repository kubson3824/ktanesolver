package ktanesolver.module.modded.regular.grocerystore;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.grocerystore.GroceryStoreOutput.Action;

class GroceryStoreSolverTest {
    private final GroceryStoreSolver solver = new GroceryStoreSolver();

    @Test void calculatesBudgetAddsItemsAndPersistsTheFirstItem() {
        ModuleEntity module = new ModuleEntity();
        GroceryStoreOutput output = solve(module, "Detergent", true);
        assertThat(output.action()).isEqualTo(Action.ADD);
        assertThat(output.budgetCents()).isEqualTo(11_000);
        assertThat(output.totalAfterCents()).isEqualTo(1_994);
        assertThat(module.getState().get("groceryStoreFirstItem")).isEqualTo("Detergent");
    }

    @Test void paysWhenTheCurrentItemCannotFitAndResetsSouvenirAfterAStrike() {
        ModuleEntity module = new ModuleEntity();
        module.setState(new java.util.HashMap<>(Map.of("groceryStoreTotalCents",10_500,"groceryStoreFirstItem","Apples")));
        assertThat(solve(module, "Detergent", false).action()).isEqualTo(Action.PAY);
        solve(module, "Milk", true);
        assertThat(module.getState().get("groceryStoreFirstItem")).isEqualTo("Milk");
    }

    @Test void rejectsUnknownItemsAndMissingSerials() {
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new GroceryStoreInput("Nope", true))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new GroceryStoreInput("Milk", true))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private GroceryStoreOutput solve(ModuleEntity module, String item, boolean reset) {
        return ((SolveSuccess<GroceryStoreOutput>) solver.solve(new RoundEntity(), bomb(), module, new GroceryStoreInput(item, reset))).output();
    }
    private static BombEntity bomb() { BombEntity bomb=new BombEntity();bomb.setSerialNumber("ABG123");bomb.setAaBatteryCount(2);return bomb; }
}
