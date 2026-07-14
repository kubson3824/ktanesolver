package ktanesolver.module.modded.regular.cheapcheckout;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.cheapcheckout.CheapCheckoutInput.Item;

@Service
@ModuleInfo(
	type = ModuleType.CHEAP_CHECKOUT,
	id = "cheap-checkout",
	name = "Cheap Checkout",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Total the six-item shopping list, apply the weekday sale, and return the correct change.",
	tags = {"modded", "shopping", "math", "money"}
)
public class CheapCheckoutSolver extends AbstractModuleSolver<CheapCheckoutInput, CheapCheckoutOutput> {
	private static final BigDecimal ZERO = new BigDecimal("0.00");
	private static final Map<String, Product> PRODUCTS = products();

	@Override
	protected SolveResult<CheapCheckoutOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CheapCheckoutInput input
	) {
		if (input == null || invalidMoney(input.paidAmount())) return failure("Enter the displayed paid amount with at most two decimal places");
		BigDecimal paid = money(input.paidAmount());

		if (Boolean.TRUE.equals(module.getState().get("waitingForSecondPayment"))) {
			BigDecimal total = money(new BigDecimal(String.valueOf(module.getState().get("total"))));
			if (paid.compareTo(total) < 0) return failure("The second paid amount must cover the total");
			List<String> paidAmounts = paidAmounts(module);
			paidAmounts.add(formatMoney(paid));
			storeState(module, Map.of("paidAmounts", paidAmounts, "waitingForSecondPayment", false));
			BigDecimal change = paid.subtract(total);
			return success(new CheapCheckoutOutput(total, paid, change, false, "Enter " + formatMoney(change) + " and press Submit"));
		}

		String validation = validateCart(input);
		if (validation != null) return failure(validation);
		BigDecimal total = total(input.items(), input.day());
		List<String> paidAmounts = new ArrayList<>(List.of(formatMoney(paid)));
		storeState(module, Map.of(
			"day", input.day().name(),
			"items", input.items(),
			"total", total.toPlainString(),
			"paidAmounts", paidAmounts
		));

		if (paid.compareTo(total) < 0) {
			storeState(module, "waitingForSecondPayment", true);
			return success(new CheapCheckoutOutput(total, paid, ZERO, true, "Press Submit without entering change, then wait for the new paid amount"), false);
		}

		BigDecimal change = paid.subtract(total);
		storeState(module, "waitingForSecondPayment", false);
		return success(new CheapCheckoutOutput(total, paid, change, false, "Enter " + formatMoney(change) + " and press Submit"));
	}

	private static String validateCart(CheapCheckoutInput input) {
		if (input.day() == null) return "Select the weekday shown when the module activated";
		if (input.items() == null || input.items().size() != 6) return "Enter all 6 shopping-list items in order";
		Set<String> names = new HashSet<>();
		for (Item item : input.items()) {
			if (item == null || item.name() == null || item.name().isBlank()) return "Every shopping-list item is required";
			Product product = PRODUCTS.get(item.name().trim().toLowerCase(Locale.ROOT));
			if (product == null) return "Unknown Cheap Checkout item: " + item.name();
			if (!names.add(item.name().trim().toLowerCase(Locale.ROOT))) return "Shopping-list items cannot repeat";
			if (product.weighted()) {
				if (item.weight() == null || !Set.of(new BigDecimal("0.5"), BigDecimal.ONE, new BigDecimal("1.5")).contains(item.weight().stripTrailingZeros())) {
					return "Weighted items must be 0.5, 1, or 1.5 lb";
				}
			} else if (item.weight() != null) return item.name() + " has a fixed price and must not have a weight";
		}
		return null;
	}

	private static BigDecimal total(List<Item> items, DayOfWeek day) {
		BigDecimal total = ZERO;
		for (int index = 0; index < items.size(); index++) {
			Item item = items.get(index);
			Product product = PRODUCTS.get(item.name().trim().toLowerCase(Locale.ROOT));
			BigDecimal price = money(product.price().multiply(product.weighted() ? item.weight() : BigDecimal.ONE));
			price = switch (day) {
				case SUNDAY -> !product.weighted() && item.name().toLowerCase(Locale.ROOT).contains("s")
					? price.add(new BigDecimal("2.15")) : price;
				case MONDAY -> index == 0 || index == 2 || index == 5 ? price.multiply(new BigDecimal("0.85")) : price;
				case TUESDAY -> !product.weighted() ? price.add(BigDecimal.valueOf(digitalRoot(price))) : price;
				case WEDNESDAY -> swapLargestAndSmallestDigits(price);
				case THURSDAY -> index % 2 == 0 ? price.multiply(new BigDecimal("0.50")) : price;
				case FRIDAY -> product.weighted() && product.category() == Category.FRUIT ? price.multiply(new BigDecimal("1.25")) : price;
				case SATURDAY -> !product.weighted() && product.category() == Category.SWEET ? price.multiply(new BigDecimal("0.65")) : price;
			};
			total = total.add(money(price));
		}
		return money(total);
	}

	private static int digitalRoot(BigDecimal price) {
		int value = price.movePointRight(2).intValueExact();
		return 1 + (value - 1) % 9;
	}

	private static BigDecimal swapLargestAndSmallestDigits(BigDecimal price) {
		String value = money(price).toPlainString();
		char smallest = '9';
		char largest = '0';
		for (char character : value.toCharArray()) if (Character.isDigit(character)) {
			smallest = (char) Math.min(smallest, character);
			largest = (char) Math.max(largest, character);
		}
		StringBuilder swapped = new StringBuilder(value.length());
		for (char character : value.toCharArray()) {
			swapped.append(character == smallest ? largest : character == largest ? smallest : character);
		}
		return new BigDecimal(swapped.toString());
	}

	private static boolean invalidMoney(BigDecimal value) {
		return value == null || value.signum() < 0 || value.scale() > 2;
	}

	private static BigDecimal money(BigDecimal value) {
		return value.setScale(2, RoundingMode.HALF_UP);
	}

	private static String formatMoney(BigDecimal value) {
		return "$" + money(value).toPlainString();
	}

	@SuppressWarnings("unchecked")
	private static List<String> paidAmounts(ModuleEntity module) {
		Object value = module.getState().get("paidAmounts");
		return value instanceof List<?> list ? new ArrayList<>((List<String>) list) : new ArrayList<>();
	}

	private static Map<String, Product> products() {
		Map<String, Product> products = new HashMap<>();
		add(products, false, Category.SWEET,
			"Candy Canes,3.51", "Mints,6.39", "Grape Jelly,2.98", "Honey,8.25", "Sugar,2.08", "Soda,2.05",
			"Lollipops,2.61", "Cookies,2.00", "Fruit Punch,2.08", "Gum,1.12", "Chocolate Bar,2.10");
		// Category only affects sweets and weighted fruit; other fixed categories can share a neutral value.
		add(products, false, Category.OTHER,
			"Socks,6.97", "Lotion,7.97", "Cheese,4.49", "Tissues,3.94", "White Bread,2.43", "Canola Oil,2.28",
			"Mustard,2.36", "Deodorant,3.97", "White Milk,3.62", "Pasta Sauce,2.30", "Paper Towels,9.46", "Tea,2.35",
			"Coffee Beans,7.85", "Mayonnaise,3.99", "Chocolate Milk,5.68", "Potato Chips,3.25", "Shampoo,4.98",
			"Toothpaste,2.50", "Peanut Butter,5.00", "Water Bottles,9.37", "Spaghetti,2.92", "Ketchup,3.59", "Cereal,4.19");
		add(products, true, Category.OTHER, "Turkey,2.98", "Chicken,1.99", "Steak,4.97", "Pork,4.14", "Lettuce,1.10", "Potatoes,0.68", "Broccoli,1.39");
		add(products, true, Category.FRUIT, "Tomatoes,1.80", "Oranges,0.80", "Lemons,1.74", "Bananas,0.87", "Grapefruit,1.08");
		return Map.copyOf(products);
	}

	private static void add(Map<String, Product> products, boolean weighted, Category category, String... entries) {
		for (String entry : entries) {
			String[] parts = entry.split(",");
			products.put(parts[0].toLowerCase(Locale.ROOT), new Product(new BigDecimal(parts[1]), category, weighted));
		}
	}

	private enum Category { FRUIT, SWEET, OTHER }
	private record Product(BigDecimal price, Category category, boolean weighted) {}
}
