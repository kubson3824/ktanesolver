package ktanesolver.module.modded.regular.grocerystore;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record GroceryStoreOutput(
    Action action, String item, int itemPriceCents, int budgetCents,
    int totalBeforeCents, int totalAfterCents, List<String> cartItems
) implements ModuleOutput {
    public enum Action { ADD, PAY }
}
