package ktanesolver.module.modded.regular.grocerystore;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.grocerystore.GroceryStoreOutput.Action;

@Service
@ModuleInfo(
    type = ModuleType.GROCERY_STORE,
    id = "groceryStore",
    name = "Grocery Store",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Track the cart and add every item that still fits within the edgework-adjusted budget.",
    tags = {"shopping", "budget", "prices", "edgework"}
)
public class GroceryStoreSolver extends AbstractModuleSolver<GroceryStoreInput, GroceryStoreOutput> {
    public static final Map<String, Integer> PRICES = prices();

    @Override
    protected SolveResult<GroceryStoreOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, GroceryStoreInput input
    ) {
        if (input == null || input.currentItem() == null) return failure("Choose the currently displayed item");
        String item = PRICES.keySet().stream().filter(name -> name.equalsIgnoreCase(input.currentItem().trim())).findFirst().orElse(null);
        if (item == null) return failure("Choose a valid Grocery Store item");
        String serial = bomb.getSerialNumber();
        if (serial == null || serial.isBlank()) return failure("Enter the bomb serial number first");

        int budget = 10_000;
        if (serial.toUpperCase().matches(".*[GSD].*")) budget += 3_200;
        if (bomb.hasPort(PortType.SERIAL)) budget += 3_000;
        if (bomb.hasPort(PortType.PARALLEL)) budget -= 1_500;
        if (bomb.getBatteryCount() > 1) budget -= 2_200;

        int total = input.resetCart() ? 0 : number(module.getState().get("groceryStoreTotalCents"));
        List<String> cart = input.resetCart() ? new ArrayList<>() : strings(module.getState().get("groceryStoreCartItems"));
        if (input.resetCart() || !module.getState().containsKey("groceryStoreFirstItem")) {
            storeState(module, "groceryStoreFirstItem", item);
        }
        int price = PRICES.get(item);
        if (total + price <= budget) {
            int nextTotal = total + price;
            cart.add(item);
            storeState(module, "groceryStoreTotalCents", nextTotal);
            storeState(module, "groceryStoreCartItems", List.copyOf(cart));
            return success(new GroceryStoreOutput(Action.ADD, item, price, budget, total, nextTotal, List.copyOf(cart)), false);
        }
        return success(new GroceryStoreOutput(Action.PAY, item, price, budget, total, total, List.copyOf(cart)));
    }

    private static int number(Object value) { return value instanceof Number number ? number.intValue() : 0; }
    private static List<String> strings(Object value) {
        if (!(value instanceof List<?> values)) return new ArrayList<>();
        return new ArrayList<>(values.stream().map(String::valueOf).toList());
    }
    private static Map<String, Integer> prices() {
        Map<String, Integer> prices = new LinkedHashMap<>();
        prices.put("Apples",96); prices.put("Bananas",58); prices.put("Bottled Water",1248); prices.put("Bread",250);
        prices.put("Butter",514); prices.put("Candy",399); prices.put("Cat Food",1199); prices.put("Cheese",256);
        prices.put("Coffee",1168); prices.put("Cookies",356); prices.put("Detergent",1994); prices.put("Eggs",250);
        prices.put("Flour",675); prices.put("Glass Cleaner",628); prices.put("Hot Sauce",542); prices.put("Jelly",549);
        prices.put("Lettuce",149); prices.put("Milk",139); prices.put("Paper Towels",868); prices.put("Peanut Butter",564);
        prices.put("Pepper",498); prices.put("Pork",499); prices.put("Potatoes",459); prices.put("Salt",348);
        prices.put("Sausage",299); prices.put("Soda",448); prices.put("Soup",528); prices.put("Steak",1200);
        prices.put("Sugar",1137); prices.put("Toilet Paper",1699); prices.put("Tomatoes",171); prices.put("Toothpaste",499);
        prices.put("Turkey",748);
        return Map.copyOf(prices);
    }
}
